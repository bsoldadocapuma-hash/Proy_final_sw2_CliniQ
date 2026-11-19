"""Validación cruzada de 5 particiones (más confiable que un solo 80/20 con pocos datos).

Uso: python -m prediccion.cli.evaluar
"""
import argparse

import numpy as np
from sklearn.model_selection import StratifiedKFold

from .. import config
from ..ml.datos import cargar_dataset
from ..ml.metricas import calcular
from ..ml.modelo import crear_modelo, probabilidades


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dataset", default=str(config.RUTA_DATASET))
    ap.add_argument("--particiones", type=int, default=5)
    a = ap.parse_args()

    X, Y, principal = cargar_dataset(a.dataset)
    skf = StratifiedKFold(a.particiones, shuffle=True, random_state=config.SEMILLA)
    P = np.zeros(Y.shape)
    for tr, te in skf.split(X, principal):
        m = crear_modelo().fit(X.iloc[tr], Y.iloc[tr])
        P[te] = probabilidades(m, X.iloc[te])

    r = calcular(Y.values, P)
    print(f"Validación cruzada ({a.particiones} particiones, {len(X)} filas)")
    print(f"  Acierto top-1: {r['acierto_top1']}   top-3: {r['acierto_top3']}   F1 macro: {r['f1_macro']}\n")
    print(f"{'enfermedad':<22}{'soporte':>8}{'recall':>8}{'prec.':>8}{'AUC':>8}")
    for slug, m in r["por_enfermedad"].items():
        print(f"{slug:<22}{m['soporte']:>8}{m['recall']:>8}{m['precision']:>8}{str(m['auc']):>8}")


if __name__ == "__main__":
    main()
