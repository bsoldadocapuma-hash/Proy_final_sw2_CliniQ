"""Entrena el modelo y lo guarda en models/modelo_prediccion.joblib.

Uso: python -m prediccion.cli.entrenar
Pasos: separa 80/20 -> entrena -> mide en el 20% -> reentrena con todo -> guarda.
"""
import argparse
import json
from datetime import datetime, timezone

import joblib
from sklearn.model_selection import train_test_split

from .. import config
from ..catalogos import SLUGS
from ..ml.caracteristicas import FEATURE_NAMES
from ..ml.datos import cargar_dataset
from ..ml.metricas import calcular
from ..ml.modelo import crear_modelo, probabilidades


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dataset", default=str(config.RUTA_DATASET))
    ap.add_argument("--semilla", type=int, default=config.SEMILLA)
    a = ap.parse_args()

    X, Y, principal = cargar_dataset(a.dataset)
    print(f"Dataset: {len(X)} filas, {X.shape[1]} características, {len(SLUGS)} enfermedades")

    Xtr, Xte, Ytr, Yte = train_test_split(
        X, Y, test_size=0.2, random_state=a.semilla, stratify=principal)
    modelo = crear_modelo(a.semilla).fit(Xtr, Ytr)
    metricas = calcular(Yte.values, probabilidades(modelo, Xte))
    print(f"Prueba (20%): top-1={metricas['acierto_top1']}  top-3={metricas['acierto_top3']}  "
          f"F1 macro={metricas['f1_macro']}")

    final = crear_modelo(a.semilla).fit(X, Y)
    config.RUTA_MODELO.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({
        "modelo": final, "features": FEATURE_NAMES, "enfermedades": SLUGS,
        "metricas_prueba": metricas, "filas_entrenamiento": len(X),
        "entrenado_en": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }, config.RUTA_MODELO)
    config.RUTA_METRICAS.write_text(json.dumps(metricas, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Modelo guardado en {config.RUTA_MODELO}")


if __name__ == "__main__":
    main()
