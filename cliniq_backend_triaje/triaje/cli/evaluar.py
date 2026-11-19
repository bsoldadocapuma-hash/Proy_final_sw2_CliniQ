"""Evalúa el triaje con validación cruzada.

Qué hace:
  * Validación cruzada estratificada. Las filas con respuestas idénticas van
    siempre juntas (mismo fold), para que los duplicados no inflen las métricas.
  * Mide el modelo solo y el FLUJO COMPLETO (modelo + confianza + reglas), que
    es lo que realmente recibe el paciente.
  * En triaje importa más el SUB-triaje (decir "menos grave" de lo real) que el
    sobre-triaje, así que se reporta aparte.
  * Muestra el efecto de distintos umbrales de confianza.
"""
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import GroupKFold, StratifiedGroupKFold, cross_val_predict

from triaje import catalogos as cat
from triaje.config import Settings
from triaje.dominio.decision import decidir_prioridad
from triaje.dominio.prioridad import gravedad
from triaje.ml.dataset import DatasetInvalido, cargar_dataset
from triaje.ml.pipeline import construir_pipeline


def _cv(y: pd.Series, grupos):
    """Elige el esquema de validación según lo que permita el dataset."""
    n_grupos = len(set(grupos))
    n = min(5, int(y.value_counts().min()), n_grupos)
    if n >= 2:
        return (StratifiedGroupKFold(n_splits=n, shuffle=True, random_state=42),
                f"{n} folds estratificados")
    n = min(5, n_grupos)
    if n >= 2:
        return (GroupKFold(n_splits=n),
                f"{n} folds NO estratificados (hay clases con un solo caso)")
    return None, ""


def _metricas(y_real, y_pred) -> dict:
    g_real = np.array([gravedad(c) for c in y_real])
    g_pred = np.array([gravedad(c) for c in y_pred])
    urgente = g_real <= gravedad("naranja")
    return {
        "exactitud": float(np.mean(g_real == g_pred)),
        "sub_triaje": float(np.mean(g_pred > g_real)),
        "sub_2_niveles": float(np.mean(g_pred - g_real >= 2)),
        "sobre_triaje": float(np.mean(g_pred < g_real)),
        "urgentes_detectados": (float(np.mean(g_pred[urgente] <= 1))
                                if urgente.any() else float("nan")),
    }


def _linea(titulo: str, m: dict) -> str:
    return (f"{titulo:<24} exactitud {m['exactitud']:.1%} | "
            f"sub-triaje {m['sub_triaje']:.1%} (>=2 niveles: {m['sub_2_niveles']:.1%}) | "
            f"sobre-triaje {m['sobre_triaje']:.1%} | "
            f"rojo/naranja detectados {m['urgentes_detectados']:.1%}")


def _detalle(y_real, y_pred, titulo: str):
    orden = [c for c in cat.ORDEN_PRIORIDAD if c in set(y_real) | set(y_pred)]
    print(f"\n--- {titulo} ---")
    print(classification_report(y_real, y_pred, labels=orden, zero_division=0))
    cm = pd.DataFrame(confusion_matrix(y_real, y_pred, labels=orden),
                      index=[f"real {c}" for c in orden],
                      columns=[f"pred {c}" for c in orden])
    print("Matriz de confusión (filas = real, columnas = predicho):")
    print(cm.to_string())


def main() -> None:
    settings = Settings.desde_entorno()
    try:
        datos = cargar_dataset(settings.dataset_path)
    except DatasetInvalido as e:
        raise SystemExit(str(e))

    X = datos[cat.FEATURES]
    y = datos[cat.OBJETIVO_PRIORIDAD]
    grupos = pd.util.hash_pandas_object(X, index=False).to_numpy()
    umbral_actual = settings.umbral_confianza

    cv, descripcion = _cv(y, grupos)
    if cv is None:
        raise SystemExit("Muy pocos datos para validación cruzada.")
    print(f"Filas: {len(datos)} | Validación: {descripcion}")

    # Predicciones "fuera de muestra": cada fila la predice un modelo que no la vio
    proba = cross_val_predict(construir_pipeline(), X, y, cv=cv, groups=grupos,
                              method="predict_proba")
    clases = np.array(sorted(y.unique()))
    pred_modelo = clases[proba.argmax(axis=1)]
    confianza = proba.max(axis=1)
    filas = X.to_dict("records")

    def flujo(umbral):
        decisiones = [decidir_prioridad(f, p, c, umbral)
                      for f, p, c in zip(filas, pred_modelo, confianza)]
        return (np.array([d.prioridad for d in decisiones]),
                np.array([d.requiere_revision for d in decisiones]))

    pred_flujo, _ = flujo(umbral_actual)
    print()
    print(_linea("Solo modelo", _metricas(y, pred_modelo)))
    print(_linea(f"Flujo completo ({umbral_actual})", _metricas(y, pred_flujo)))

    _detalle(y, pred_modelo, "Solo modelo")
    _detalle(y, pred_flujo, f"Flujo completo (reglas + umbral {umbral_actual})")

    # ---- Efecto del umbral de confianza -----------------------------------
    tabla = []
    for u in (0.0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8):
        pred_u, revision = flujo(u)
        m = _metricas(y, pred_u)
        tabla.append({
            "umbral": u,
            "sub_triaje": f"{m['sub_triaje']:.1%}",
            "sobre_triaje": f"{m['sobre_triaje']:.1%}",
            "rojo/naranja detectados": f"{m['urgentes_detectados']:.1%}",
            "casos a revisión": f"{revision.mean():.1%}",
        })
    print("\n--- Efecto del umbral de confianza (0.0 = sin subir prioridad) ---")
    print(pd.DataFrame(tabla).to_string(index=False))

    # ---- Área de derivación ------------------------------------------------
    y_area = datos[cat.OBJETIVO_AREA]
    cv_a, desc_a = _cv(y_area, grupos)
    if cv_a is not None:
        pred_area = cross_val_predict(construir_pipeline(), X, y_area, cv=cv_a, groups=grupos)
        print(f"\nÁrea de derivación ({desc_a}): exactitud "
              f"{accuracy_score(y_area, pred_area):.1%}")

    print("\nNota: con datos sintéticos o pequeños estas métricas son optimistas. "
          "Valídalas con casos reales etiquetados por un profesional.")
