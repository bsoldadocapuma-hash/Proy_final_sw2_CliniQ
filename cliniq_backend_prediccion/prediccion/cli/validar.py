"""Valida un dataset antes de entrenar (útil cuando lo generes con datos reales).

Uso: python -m prediccion.cli.validar [--ruta data/dataset_prediccion.csv]
Sale con código 1 si encuentra errores.
"""
import argparse
import sys

import pandas as pd

from .. import config
from ..catalogos import GRUPOS_SANGUINEOS, SINTOMAS, SLUGS
from ..dominio.normalizacion import normalizar
from ..ml.datos import COLUMNAS, _partir

MIN_POSITIVOS = 5


def validar(ruta) -> tuple[list, list]:
    errores, avisos = [], []
    df = pd.read_csv(ruta, dtype={"grupo_sanguineo": str})
    faltan = [c for c in COLUMNAS if c not in df.columns]
    if faltan:
        return [f"Faltan columnas: {faltan}"], avisos

    sintomas_ok = {normalizar(s) for s in SINTOMAS}
    conteo = dict.fromkeys(SLUGS, 0)
    for i, f in df.iterrows():
        n = i + 2  # fila real en el archivo (1 = encabezado)
        if not 0 <= f["edad"] <= 120:
            errores.append(f"fila {n}: edad fuera de rango")
        if f["genero"] not in ("M", "F"):
            errores.append(f"fila {n}: genero debe ser M o F")
        if not pd.isna(f["grupo_sanguineo"]) and f["grupo_sanguineo"] not in GRUPOS_SANGUINEOS:
            errores.append(f"fila {n}: grupo_sanguineo inválido")
        if not 2 <= f["peso_kg"] <= 400 or not 40 <= f["altura_cm"] <= 250:
            errores.append(f"fila {n}: peso/altura fuera de rango")
        for item in _partir(f["sintomas"]):
            nombre, _, sev = item.rpartition(":")
            if normalizar(nombre) not in sintomas_ok:
                errores.append(f"fila {n}: síntoma desconocido {nombre!r}")
            if sev not in ("1", "2", "3"):
                errores.append(f"fila {n}: severidad inválida en {item!r} (usa 1, 2 o 3)")
        etiquetas = _partir(f["enfermedades"])
        if not etiquetas:
            errores.append(f"fila {n}: sin enfermedad")
        for e in etiquetas:
            if e not in conteo:
                errores.append(f"fila {n}: enfermedad desconocida {e!r}")
            else:
                conteo[e] += 1

    for slug, c in conteo.items():
        if c == 0:
            errores.append(f"'{slug}' no tiene ninguna fila (el modelo no podrá predecirla)")
        elif c < MIN_POSITIVOS:
            avisos.append(f"'{slug}' tiene solo {c} filas (recomendado >= {MIN_POSITIVOS})")
    if df.duplicated().any():
        avisos.append(f"{int(df.duplicated().sum())} filas duplicadas")
    return errores, avisos


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--ruta", default=str(config.RUTA_DATASET))
    a = ap.parse_args()
    errores, avisos = validar(a.ruta)
    for m in avisos:
        print("AVISO:", m)
    for m in errores:
        print("ERROR:", m)
    print("Dataset VÁLIDO" if not errores else f"{len(errores)} error(es)")
    sys.exit(1 if errores else 0)


if __name__ == "__main__":
    main()
