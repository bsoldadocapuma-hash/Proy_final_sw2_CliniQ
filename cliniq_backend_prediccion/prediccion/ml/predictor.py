"""Carga el modelo entrenado y responde consultas."""
import joblib
import numpy as np
import pandas as pd

from .. import config
from ..catalogos import SLUGS
from ..dominio.riesgo import armar_respuesta
from .caracteristicas import FEATURE_NAMES, IMC_NORMAL_REFERENCIA, extraer
from .modelo import probabilidades


def _logit(p: float) -> float:
    p = min(max(float(p), 1e-6), 1 - 1e-6)
    return float(np.log(p / (1 - p)))


_CONTADOR = {"sintoma": "n_sintomas", "dx": "n_diagnosticos", "med": "n_medicamentos"}


class ModeloNoEntrenado(RuntimeError):
    """No existe el archivo del modelo. Ejecuta: python -m prediccion.cli.entrenar"""


class Predictor:
    def __init__(self, ruta=config.RUTA_MODELO):
        self.ruta = ruta
        self._bundle = None

    @property
    def bundle(self):
        if self._bundle is None:
            if not self.ruta.exists():
                raise ModeloNoEntrenado(f"No se encontró {self.ruta}. Ejecuta: python -m prediccion.cli.entrenar")
            self._bundle = joblib.load(self.ruta)
        return self._bundle

    def _proba(self, vector: dict) -> np.ndarray:
        X = pd.DataFrame([vector], columns=FEATURE_NAMES)
        return probabilidades(self.bundle["modelo"], X)[0]

    def _patrones(self, extraccion, indice: int, p_base: float, max_items: int = 4) -> str:
        """Factores que más pesan: se quita cada uno y se mide cuánto baja la puntuación (en log-odds,
        para que siga funcionando cuando la probabilidad está cerca de 1)."""
        impactos = []
        base = _logit(p_base)
        for tipo, feat, etiqueta in extraccion.activos:
            v = dict(extraccion.vector)
            if tipo == "imc":
                v["imc"] = IMC_NORMAL_REFERENCIA
            else:
                v[feat] = 0.0
                cont = _CONTADOR[tipo]
                v[cont] = max(0.0, v[cont] - 1)
            impactos.append((base - _logit(self._proba(v)[indice]), etiqueta))
        impactos = [i for i in sorted(impactos, key=lambda x: x[0], reverse=True) if i[0] > 0.1]
        if not impactos:
            return "Sin factores individuales determinantes"
        return " + ".join(etq for _, etq in impactos[:max_items])

    def predecir(self, entrada: dict) -> dict:
        ext = extraer(entrada)
        proba = self._proba(ext.vector)
        indice_max = int(np.argmax(proba))
        patrones = self._patrones(ext, indice_max, float(proba[indice_max]))
        return armar_respuesta(dict(zip(SLUGS, proba)), patrones, ext.advertencias)


predictor = Predictor()
