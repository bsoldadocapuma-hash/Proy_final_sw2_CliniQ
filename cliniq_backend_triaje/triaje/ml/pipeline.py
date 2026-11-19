"""Pipeline de scikit-learn: preprocesamiento + Random Forest."""
from __future__ import annotations

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from triaje import catalogos as cat


def construir_pipeline() -> Pipeline:
    preprocesador = ColumnTransformer([
        # Texto -> columnas 0/1. handle_unknown evita errores con valores nuevos.
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat.CATEGORICAS),
        # Números. La temperatura puede venir vacía: se rellena con la mediana
        # y se agrega una columna que indica "no informada".
        ("num", SimpleImputer(strategy="median", add_indicator=True), cat.NUMERICAS),
        # Casillas ya son 0/1
        ("bin", "passthrough", cat.BINARIAS),
    ])
    return Pipeline([
        ("prep", preprocesador),
        ("rf", RandomForestClassifier(
            n_estimators=200,
            random_state=42,
            class_weight="balanced",  # compensa colores con pocos casos
        )),
    ])


def entrenar_modelos(datos: pd.DataFrame) -> dict:
    """Entrena el modelo de prioridad y el de área con todos los datos."""
    X = datos[cat.FEATURES]
    modelos = {}
    for objetivo, clave in ((cat.OBJETIVO_PRIORIDAD, "prioridad"),
                            (cat.OBJETIVO_AREA, "area")):
        modelo = construir_pipeline()
        modelo.fit(X, datos[objetivo])
        modelos[clave] = modelo
    return modelos
