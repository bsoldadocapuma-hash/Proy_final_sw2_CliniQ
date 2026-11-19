"""Decisión final: combina la predicción del modelo, su confianza y las reglas."""
from __future__ import annotations

from dataclasses import dataclass

from .prioridad import gravedad, subir_un_nivel
from .reglas import reglas_aplicadas


@dataclass(frozen=True)
class Decision:
    prioridad: str
    origen: str                      # regla_alarma | regla (...) | modelo_confianza_baja | modelo
    requiere_revision: bool
    reglas: tuple[str, ...] = ()     # nombres de todas las reglas que aplicaron


def decidir_prioridad(fila: dict, prioridad_modelo: str, confianza: float,
                      umbral: float) -> Decision:
    """Orden: modelo -> (si la confianza es baja) sube un nivel -> las reglas nunca bajan."""
    aplicadas = reglas_aplicadas(fila)
    nombres = tuple(r.nombre for r in aplicadas)
    peor = min(aplicadas, key=lambda r: gravedad(r.minimo)) if aplicadas else None

    if peor and peor.minimo == "rojo":
        return Decision("rojo", "regla_alarma", False, nombres)

    prioridad, origen = prioridad_modelo, "modelo"
    requiere_revision = confianza < umbral
    if requiere_revision:
        subida = subir_un_nivel(prioridad)
        if subida != prioridad:
            prioridad, origen = subida, "modelo_confianza_baja"

    # Nunca bajar de lo que dictan las reglas
    if peor and gravedad(peor.minimo) < gravedad(prioridad):
        prioridad, origen = peor.minimo, f"regla ({peor.nombre})"

    return Decision(prioridad, origen, requiere_revision, nombres)
