"""Servicio de triaje: aplica reglas + modelo a una fila ya validada."""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from triaje import catalogos as cat
from triaje.dominio.decision import decidir_prioridad
from triaje.dominio.reglas import reglas_aplicadas
from triaje.dominio.prioridad import gravedad
from . import almacen


class ServicioTriaje:
    def __init__(self, modelos: dict, meta: dict, umbral: float):
        self.modelos = modelos
        self.meta = meta
        self.umbral = umbral

    @classmethod
    def desde_archivo(cls, ruta: Path, umbral: float) -> "ServicioTriaje":
        modelos, meta = almacen.cargar(ruta)
        return cls(modelos, meta, umbral)

    def clasificar(self, fila: dict) -> dict:
        """Devuelve el resultado de triaje (sin el aviso legal) para una fila."""
        aplicadas = reglas_aplicadas(fila)
        if any(r.minimo == "rojo" for r in aplicadas):
            # No se consulta al modelo: se deriva de inmediato
            return {
                "prioridad": "rojo",
                "area_derivacion": "emergencias",
                "origen": "regla_alarma",
                "requiere_revision": False,
                "reglas_aplicadas": [r.nombre for r in aplicadas],
                "mensaje": cat.MENSAJES["rojo"],
            }

        X = pd.DataFrame([fila])[cat.FEATURES]
        modelo = self.modelos["prioridad"]
        proba = modelo.predict_proba(X)[0]
        prioridad_modelo = str(modelo.classes_[proba.argmax()])
        confianza = float(proba.max())
        area = str(self.modelos["area"].predict(X)[0])

        d = decidir_prioridad(fila, prioridad_modelo, confianza, self.umbral)
        if gravedad(d.prioridad) == 0:
            area = "emergencias"
        return {
            "prioridad": d.prioridad,
            "area_derivacion": area,
            "confianza_prioridad": round(confianza, 2),
            "origen": d.origen,
            "requiere_revision": d.requiere_revision,
            "reglas_aplicadas": list(d.reglas),
            "mensaje": cat.MENSAJES[d.prioridad],
        }
