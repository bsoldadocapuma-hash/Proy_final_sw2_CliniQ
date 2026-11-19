"""Catálogos: única fuente de verdad de lo que acepta la API y lo que usa el modelo.

Se derivan de aquí las columnas del CSV, la validación y GET /api/v1/catalogos.
"""
import hashlib
import json

from .alarmas import ALARMAS, Alarma
from .enfermedades import ENFERMEDADES, Enfermedad
from .general import (AREAS, AVISO, DURACION, EDADES, EDADES_SIN_EMBARAZO, EMBARAZO,
                      EVOLUCION, INICIO, INTENSIDAD_TEXTO, MAX_MOTIVOS, MENSAJES,
                      ORDEN_PRIORIDAD, SEXOS, VALOR_NINGUNA)
from .motivos import MOTIVOS, Motivo

# --- Índices ---------------------------------------------------------------
MOTIVO_POR_ID = {m.id: m for m in MOTIVOS}
ALARMA_POR_ID = {a.id: a for a in ALARMAS}
ENFERMEDAD_POR_ID = {e.id: e for e in ENFERMEDADES}

# id -> columna binaria del CSV (el paciente puede marcar varios motivos a la vez)
COLUMNA_MOTIVO = {m.id: f"motivo_{m.id}" for m in MOTIVOS}
COLUMNA_ALARMA = {a.id: a.columna for a in ALARMAS}
COLUMNA_ENFERMEDAD = {e.id: e.id for e in ENFERMEDADES}

# --- Valores permitidos de las variables categóricas ---------------------------
VALORES = {
    "edad": [i for i, _ in EDADES],
    "sexo": [i for i, _ in SEXOS],
    "embarazo": [i for i, _ in EMBARAZO],
    "inicio": [i for i, _ in INICIO],
    "duracion": [i for i, _ in DURACION],
    "evolucion": [i for i, _ in EVOLUCION],
}

# --- Columnas que usa el modelo --------------------------------------------------
CATEGORICAS = list(VALORES.keys())
NUMERICAS = ["intensidad", "temperatura"]
BINARIAS = (list(COLUMNA_MOTIVO.values()) + list(COLUMNA_ALARMA.values())
            + list(COLUMNA_ENFERMEDAD.values()))
FEATURES = CATEGORICAS + NUMERICAS + BINARIAS

OBJETIVO_PRIORIDAD = "prioridad"
OBJETIVO_AREA = "area_derivacion"
OBJETIVOS = [OBJETIVO_PRIORIDAD, OBJETIVO_AREA]


def huella() -> str:
    """Huella del catálogo. Si cambia (p. ej. agregas un motivo), hay que reentrenar."""
    contenido = json.dumps({"valores": VALORES, "motivos": COLUMNA_MOTIVO,
                            "alarmas": COLUMNA_ALARMA, "enfermedades": COLUMNA_ENFERMEDAD},
                           sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(contenido.encode()).hexdigest()[:16]


def como_json() -> dict:
    """Catálogos para que el frontend dibuje los formularios."""
    def opciones(pares):
        return [{"id": i, "etiqueta": e} for i, e in pares]

    return {
        "edad": opciones(EDADES),
        "sexo": opciones(SEXOS),
        "embarazo": {
            "opciones": opciones([p for p in EMBARAZO if p[0] != "no_aplica"]),
            "nota": "Solo se pregunta a mujeres de 13 años o más; en los demás casos "
                    "la API lo completa sola.",
        },
        "motivos_consulta": [
            {"id": m.id, "etiqueta": m.etiqueta, "grupo": m.grupo, "sexo": m.sexo}
            for m in MOTIVOS],
        "limites": {
            "motivos_consulta": {"min": 1, "max": MAX_MOTIVOS},
            "nota": "motivo_consulta se envía como lista (también acepta un solo texto).",
        },
        "inicio": opciones(INICIO),
        "duracion": opciones(DURACION),
        "evolucion": opciones(EVOLUCION),
        "intensidad": {"min": 0, "max": 10, "texto": INTENSIDAD_TEXTO},
        "temperatura": {"min": 34, "max": 42, "opcional": True},
        "senales_alarma": [
            {"id": a.id, "etiqueta": a.etiqueta, "sexo": a.sexo} for a in ALARMAS],
        "enfermedades": [{"id": e.id, "etiqueta": e.etiqueta} for e in ENFERMEDADES],
        "valor_ninguna": VALOR_NINGUNA,
    }


def _verificar() -> None:
    """Falla al importar si el catálogo tiene errores (ids repetidos, etc.)."""
    def unicos(nombre, valores):
        if len(set(valores)) != len(valores):
            raise ValueError(f"Catálogo '{nombre}': hay valores repetidos.")

    unicos("motivos", [m.id for m in MOTIVOS])
    unicos("alarmas (id)", [a.id for a in ALARMAS])
    unicos("enfermedades", [e.id for e in ENFERMEDADES])
    unicos("columnas del modelo", FEATURES)
    for m in MOTIVOS:
        if m.area not in AREAS:
            raise ValueError(f"Motivo '{m.id}': área '{m.area}' no está en AREAS.")
        if m.base not in ORDEN_PRIORIDAD[1:]:
            raise ValueError(f"Motivo '{m.id}': base '{m.base}' inválida.")
        if m.sexo not in (None, "M", "F"):
            raise ValueError(f"Motivo '{m.id}': sexo inválido.")
    for a in ALARMAS:
        if a.nivel not in ("rojo", "naranja"):
            raise ValueError(f"Alarma '{a.id}': nivel debe ser rojo o naranja.")
    if VALOR_NINGUNA in set(COLUMNA_ALARMA) | set(COLUMNA_ENFERMEDAD):
        raise ValueError(f"'{VALOR_NINGUNA}' no puede ser un id de alarma o enfermedad.")


_verificar()
