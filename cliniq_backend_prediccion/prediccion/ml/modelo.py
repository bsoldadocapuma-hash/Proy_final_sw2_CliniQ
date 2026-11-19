"""Modelo multi-etiqueta: una misma consulta puede tener varias enfermedades probables a la vez.

Se entrena un clasificador independiente por enfermedad (uno-contra-todos) con regresión
logística. Se eligió sobre Random Forest porque, con pocos casos por enfermedad, el RF
comprime las probabilidades (casi nunca pasa de 0.5) y pierde sensibilidad en las
enfermedades menos frecuentes. Ver README, sección "Decisiones de diseño".
"""
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from .. import config


def crear_modelo(semilla: int = config.SEMILLA, c: float = config.REGULARIZACION_C):
    base = make_pipeline(
        StandardScaler(),
        LogisticRegression(C=c, class_weight="balanced", max_iter=2000, random_state=semilla),
    )
    return OneVsRestClassifier(base)


def probabilidades(modelo, X) -> np.ndarray:
    """Matriz (n_muestras, n_enfermedades) con la puntuación de cada enfermedad (0 a 1)."""
    return modelo.predict_proba(X)
