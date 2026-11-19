"""Reglas de seguridad: fijan una prioridad MÍNIMA que el modelo no puede bajar.

EJEMPLOS: deben ser definidas y validadas por un profesional de salud.
Para agregar una regla: añade una `Regla(...)` a REGLAS_CLINICAS.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Callable

from triaje import catalogos as cat
from .prioridad import gravedad


@dataclass(frozen=True)
class Regla:
    nombre: str
    minimo: str                      # rojo | naranja
    aplica: Callable[[dict], bool]


def _tiene(fila: dict, *motivos: str) -> bool:
    """True si el paciente marcó alguno de esos motivos de consulta."""
    return any(fila[cat.COLUMNA_MOTIVO[m]] == 1 for m in motivos)


def _temp_al_menos(fila: dict, grados: float) -> bool:
    t = fila["temperatura"]
    return t is not None and not math.isnan(t) and t >= grados


# --- 1. Una regla por cada señal de alarma (nivel definido en el catálogo) -----
REGLAS_ALARMAS = [
    Regla(f"señal de alarma: {a.etiqueta}", a.nivel,
          lambda fila, col=a.columna: fila[col] == 1)
    for a in cat.ALARMAS
]

# --- 2. Reglas clínicas combinadas ----------------------------------------------
REGLAS_CLINICAS = [
    Regla("dolor de pecho intenso de inicio súbito", "naranja",
          lambda f: _tiene(f, "dolor_pecho") and f["intensidad"] >= 7
          and f["inicio"] == "de_golpe"),
    Regla("lactante menor de 1 año con fiebre", "naranja",
          lambda f: f["edad"] == "menor_1" and _temp_al_menos(f, 38)),
    Regla("dificultad para respirar que empeora", "naranja",
          lambda f: _tiene(f, "dificultad_respirar")
          and f["evolucion"] == "empeora"),
    Regla("dolor de cabeza muy intenso y de inicio súbito", "naranja",
          lambda f: _tiene(f, "dolor_cabeza") and f["intensidad"] >= 9
          and f["inicio"] == "de_golpe"),
    Regla("convulsión", "naranja",
          lambda f: _tiene(f, "convulsion")),
    Regla("intoxicación o envenenamiento", "naranja",
          lambda f: _tiene(f, "intoxicacion_envenenamiento")),
    Regla("embarazada con sangrado vaginal", "naranja",
          lambda f: f["embarazo"] == "si" and _tiene(f, "sangrado_vaginal")),
    Regla("embarazada con dolor abdominal intenso", "naranja",
          lambda f: f["embarazo"] == "si" and _tiene(f, "dolor_abdominal")
          and f["intensidad"] >= 7),
    Regla("golpe, herida o sangrado tomando anticoagulantes", "naranja",
          lambda f: f["anticoagulantes"] == 1
          and _tiene(f, "golpe_caida", "herida_sangrado", "sangrado_nariz")),
]

REGLAS = REGLAS_ALARMAS + REGLAS_CLINICAS


def reglas_aplicadas(fila: dict) -> list[Regla]:
    return [r for r in REGLAS if r.aplica(fila)]


def prioridad_minima_por_reglas(fila: dict):
    """Devuelve (color_minimo, nombre_regla) o (None, None) si no aplica ninguna.
    Si aplican varias, devuelve la más grave."""
    aplicadas = reglas_aplicadas(fila)
    if not aplicadas:
        return None, None
    r = min(aplicadas, key=lambda r: gravedad(r.minimo))
    return r.minimo, r.nombre
