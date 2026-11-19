"""Carga y validación del dataset de entrenamiento."""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import pandas as pd

from triaje import catalogos as cat
from triaje.dominio import reglas
from triaje.dominio.prioridad import gravedad
from triaje.dominio.validacion import embarazo_no_aplica  # noqa: F401  (misma regla que la API)

REQUERIDAS = cat.CATEGORICAS + cat.NUMERICAS + cat.OBJETIVOS   # las casillas son opcionales


class DatasetInvalido(Exception):
    """El CSV tiene errores que impiden entrenar."""


def _leer_csv(ruta) -> pd.DataFrame:
    """Lee el CSV probando coma, punto y coma (Excel en español) y tabulador."""
    ultimo = None
    for sep in (",", ";", "\t"):
        try:
            df = pd.read_csv(ruta, sep=sep, encoding="utf-8-sig", skipinitialspace=True)
        except pd.errors.ParserError:
            continue  # separador equivocado
        df.columns = [str(c).strip() for c in df.columns]
        if set(REQUERIDAS) <= set(df.columns):
            return df
        if ultimo is None:
            ultimo = df
    if ultimo is None:
        raise DatasetInvalido("No se pudo leer el CSV (revisa el formato).")
    raise DatasetInvalido(f"Faltan columnas en el CSV: {sorted(set(REQUERIDAS) - set(ultimo.columns))}")


def _texto(serie: pd.Series, minusculas: bool = False) -> pd.Series:
    def limpiar(v):
        if not isinstance(v, str):
            return v
        v = v.strip()
        return v.lower() if minusculas else v
    return serie.map(limpiar)


def _a_numero(serie: pd.Series):
    """Devuelve (numeros, vacio, malformado). Acepta '38,5' como 38.5."""
    vacio = serie.isna() | (serie.astype(str).str.strip() == "")
    txt = serie.astype(str).str.strip().str.replace(",", ".", regex=False)
    num = pd.to_numeric(txt, errors="coerce").astype(float)
    num[vacio] = np.nan
    return num, vacio, (~vacio & num.isna())


def cargar_dataset(ruta: Path | str | None = None, verbose: bool = True) -> pd.DataFrame:
    """Lee, limpia y valida el CSV. Lanza DatasetInvalido si hay errores."""
    if ruta is None:
        from triaje.config import Settings
        ruta = Settings.desde_entorno().dataset_path
    if not os.path.exists(ruta):
        raise DatasetInvalido(f"No existe el dataset: {ruta}")

    df = _leer_csv(ruta)
    errores, avisos = [], []

    # CSV de la versión anterior: una sola columna 'motivo_consulta' -> columnas motivo_*
    if "motivo_consulta" in df.columns:
        unico = _texto(df["motivo_consulta"])
        desconocido = unico.notna() & ~unico.isin(cat.COLUMNA_MOTIVO)
        if desconocido.any():
            vistos = list(unico[desconocido].astype(str).unique()[:5])
            errores.append(f"'motivo_consulta' con valores no permitidos {vistos}. "
                           f"Revisa triaje/catalogos/motivos.py")
        nuevas = {col: (unico == id_).astype(int)
                  for id_, col in cat.COLUMNA_MOTIVO.items() if col not in df.columns}
        df = pd.concat([df, pd.DataFrame(nuevas, index=df.index)], axis=1)
        avisos.append("El CSV usa una sola columna 'motivo_consulta' (formato anterior): "
                      "se convirtió a columnas motivo_* (una casilla por motivo).")

    # Casillas ausentes (p. ej. un CSV de una versión anterior): se asumen en 0
    faltan = [c for c in cat.BINARIAS if c not in df.columns]
    if faltan:
        df = pd.concat([df, pd.DataFrame(0, index=df.index, columns=faltan)], axis=1)
    if faltan:
        avisos.append(f"El CSV no tiene {len(faltan)} columna(s) de casillas "
                      f"(p. ej. {faltan[:3]}): se asumen 0. "
                      f"El modelo no aprenderá nada sobre ellas hasta que las agregues.")

    df = df[cat.FEATURES + cat.OBJETIVOS].dropna(how="all").reset_index(drop=True)

    def filas(mask) -> str:  # números de línea del CSV (cabecera = línea 1)
        idx = mask[mask].index
        extra = "..." if len(idx) > 5 else ""
        return ", ".join(str(i + 2) for i in idx[:5]) + extra

    # ---- Texto: quitar espacios; las etiquetas en minúsculas -------------
    for c in cat.CATEGORICAS:
        df[c] = _texto(df[c])
    for c in cat.OBJETIVOS:
        df[c] = _texto(df[c], minusculas=True)

    # ---- Embarazo: misma regla que la API --------------------------------
    sin_embarazo = df["sexo"].eq("M") | df["edad"].isin(cat.EDADES_SIN_EMBARAZO)
    corregidas = sin_embarazo & df["embarazo"].ne("no_aplica")
    if corregidas.any():
        avisos.append(f"{int(corregidas.sum())} fila(s) con embarazo distinto de "
                      f"'no_aplica' en hombres o menores de 13: se corrigen "
                      f"(líneas {filas(corregidas)}).")
    df.loc[sin_embarazo, "embarazo"] = "no_aplica"
    mujer_na = df["sexo"].eq("F") & ~sin_embarazo & df["embarazo"].eq("no_aplica")
    if mujer_na.any():
        avisos.append(f"{int(mujer_na.sum())} mujer(es) de 13+ con 'no_aplica': "
                      f"se toman como 'no' (líneas {filas(mujer_na)}). Revísalas.")
        df.loc[mujer_na, "embarazo"] = "no"

    # ---- Categóricas ------------------------------------------------------
    for campo, permitidos in cat.VALORES.items():
        vacios = df[campo].isna()
        if vacios.any():
            errores.append(f"'{campo}' vacío (líneas {filas(vacios)}).")
        invalido = df[campo].notna() & ~df[campo].isin(permitidos)
        if invalido.any():
            vistos = list(df.loc[invalido, campo].astype(str).unique()[:5])
            errores.append(f"'{campo}' con valores no permitidos {vistos} "
                           f"(líneas {filas(invalido)}). Revisa triaje/catalogos.")

    # ---- Numéricas --------------------------------------------------------
    num, vacio, malo = _a_numero(df["intensidad"])
    mala = vacio | malo | (~vacio & ~malo & ~num.between(0, 10))
    if mala.any():
        errores.append(f"'intensidad' debe ser un número de 0 a 10 (líneas {filas(mala)}).")
    df["intensidad"] = num

    num, vacio, malo = _a_numero(df["temperatura"])
    mala = malo | (~vacio & ~malo & ~num.between(34, 42))
    if mala.any():
        errores.append(f"'temperatura' debe estar entre 34 y 42 o vacía (líneas {filas(mala)}).")
    df["temperatura"] = num  # vacía = NaN, el imputador la rellena

    # ---- Binarias (casillas 0/1) ------------------------------------------
    for c in cat.BINARIAS:
        num, vacio, malo = _a_numero(df[c])
        mala = vacio | malo | (~vacio & ~malo & ~num.isin([0, 1]))
        if mala.any():
            errores.append(f"'{c}' debe ser 0 o 1 (líneas {filas(mala)}).")
        df[c] = num

    # ---- Motivos de consulta: al menos uno por fila ------------------------
    cols_motivo = list(cat.COLUMNA_MOTIVO.values())
    n_motivos = df[cols_motivo].sum(axis=1)
    sin_motivo = n_motivos == 0
    if sin_motivo.any():
        errores.append(f"Filas sin ningún motivo de consulta (líneas {filas(sin_motivo)}).")
    demasiados = n_motivos > cat.MAX_MOTIVOS
    if demasiados.any():
        avisos.append(f"{int(demasiados.sum())} fila(s) con más de {cat.MAX_MOTIVOS} motivos "
                      f"(la API acepta como máximo {cat.MAX_MOTIVOS}; líneas {filas(demasiados)}).")

    # ---- Etiquetas ---------------------------------------------------------
    pri = cat.OBJETIVO_PRIORIDAD
    vacios = df[pri].isna()
    if vacios.any():
        errores.append(f"'{pri}' vacía (líneas {filas(vacios)}).")
    invalido = df[pri].notna() & ~df[pri].isin(cat.ORDEN_PRIORIDAD)
    if invalido.any():
        vistos = list(df.loc[invalido, pri].astype(str).unique()[:5])
        errores.append(f"'{pri}' con colores no permitidos {vistos} "
                       f"(líneas {filas(invalido)}). Permitidos: {cat.ORDEN_PRIORIDAD}")
    area = cat.OBJETIVO_AREA
    vacios = df[area].isna()
    if vacios.any():
        errores.append(f"'{area}' vacía (líneas {filas(vacios)}).")
    invalido = df[area].notna() & ~df[area].isin(cat.AREAS)
    if invalido.any():
        vistos = list(df.loc[invalido, area].astype(str).unique()[:5])
        errores.append(f"'{area}' con áreas no permitidas {vistos} "
                       f"(líneas {filas(invalido)}). Permitidas: {cat.AREAS}")

    if errores:
        raise DatasetInvalido("Errores en el dataset:\n - " + "\n - ".join(errores))

    df[cat.BINARIAS] = df[cat.BINARIAS].astype(int)

    # ---- Avisos de calidad (no impiden entrenar) --------------------------
    incoherente = pd.Series(False, index=df.index)
    for m in cat.MOTIVOS:
        if m.sexo:
            incoherente |= (df[cat.COLUMNA_MOTIVO[m.id]] == 1) & df["sexo"].ne(m.sexo)
    if incoherente.any():
        avisos.append(f"{int(incoherente.sum())} fila(s) con un motivo que no corresponde "
                      f"al sexo (líneas {filas(incoherente)}).")

    contradicen = pd.Series(False, index=df.index)
    for i, fila in enumerate(df[cat.FEATURES].to_dict("records")):
        minimo, _ = reglas.prioridad_minima_por_reglas(fila)
        if minimo and gravedad(df.at[i, pri]) > gravedad(minimo):
            contradicen.iloc[i] = True
    if contradicen.any():
        avisos.append(f"{int(contradicen.sum())} fila(s) con una prioridad MENOS grave que "
                      f"la mínima de las reglas de seguridad (líneas {filas(contradicen)}). "
                      f"Revisa esas etiquetas.")

    duplicadas = df.duplicated(subset=REQUERIDAS + cat.BINARIAS)
    if duplicadas.any():
        avisos.append(f"{int(duplicadas.sum())} fila(s) duplicada(s) exactas. "
                      f"Inflan las métricas; considera quitarlas.")
    huella = pd.util.hash_pandas_object(df[cat.FEATURES], index=False)
    conflictos = int((df.groupby(huella)[pri].nunique() > 1).sum())
    if conflictos:
        avisos.append(f"{conflictos} combinación(es) de respuestas con "
                      f"prioridades distintas (etiquetas contradictorias).")

    raros = df[pri].value_counts()
    poco = [f"{c} ({raros.get(c, 0)})" for c in cat.ORDEN_PRIORIDAD if raros.get(c, 0) < 20]
    if poco:
        avisos.append(f"Pocos ejemplos de: {', '.join(poco)}. Conviene tener 20 o más por color.")

    if verbose:
        for a in avisos:
            print(f"AVISO: {a}")
    return df
