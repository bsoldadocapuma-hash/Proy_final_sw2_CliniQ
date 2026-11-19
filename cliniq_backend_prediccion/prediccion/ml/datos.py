"""Lectura del dataset CSV y conversión a matrices X / Y.

Columnas del CSV:
  edad, genero, grupo_sanguineo, peso_kg, altura_cm,
  sintomas      -> "Dolor de pecho:3|Fiebre:2"   (nombre:severidad 1-3)
  diagnosticos  -> "Hipertensión arterial|Diabetes mellitus"   (texto libre)
  medicamentos  -> "Losartán|Metformina"
  enfermedades  -> "hipertension|diabetes"   (slugs; la PRIMERA es la principal)
"""
import numpy as np
import pandas as pd

from ..catalogos import SLUGS
from .caracteristicas import FEATURE_NAMES, extraer

COLUMNAS = ["edad", "genero", "grupo_sanguineo", "peso_kg", "altura_cm",
            "sintomas", "diagnosticos", "medicamentos", "enfermedades"]


def _partir(celda) -> list:
    if pd.isna(celda) or str(celda).strip() == "":
        return []
    return [p.strip() for p in str(celda).split("|") if p.strip()]


def fila_a_entrada(fila) -> dict:
    sintomas = []
    for item in _partir(fila["sintomas"]):
        nombre, _, sev = item.rpartition(":")
        sintomas.append({"nombre": nombre, "severidad": sev})
    return {
        "usuario": {
            "edad": fila["edad"], "genero": fila["genero"],
            "grupo_sanguineo": None if pd.isna(fila["grupo_sanguineo"]) else fila["grupo_sanguineo"],
            "peso_kg": fila["peso_kg"], "altura_cm": fila["altura_cm"],
        },
        "sintomas": sintomas,
        "diagnosticos": [{"descripcion": d} for d in _partir(fila["diagnosticos"])],
        "medicamentos": [{"nombre": m} for m in _partir(fila["medicamentos"])],
    }


def cargar_dataset(ruta):
    """Devuelve (X: DataFrame, Y: DataFrame multi-etiqueta, principal: Series)."""
    df = pd.read_csv(ruta, dtype={"grupo_sanguineo": str})
    filas, etiquetas, principal = [], [], []
    for _, fila in df.iterrows():
        filas.append(extraer(fila_a_entrada(fila)).vector)
        slugs = _partir(fila["enfermedades"])
        etiquetas.append([1 if s in slugs else 0 for s in SLUGS])
        principal.append(slugs[0])
    X = pd.DataFrame(filas, columns=FEATURE_NAMES)
    Y = pd.DataFrame(np.array(etiquetas), columns=SLUGS)
    return X, Y, pd.Series(principal, name="principal")
