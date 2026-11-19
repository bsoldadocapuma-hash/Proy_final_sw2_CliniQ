"""Métricas para un problema multi-etiqueta."""
import numpy as np
from sklearn.metrics import f1_score, roc_auc_score

from ..catalogos import SLUGS


def calcular(Y_real: np.ndarray, P: np.ndarray, umbral: float = 0.5) -> dict:
    """Y_real y P: matrices (n, n_enfermedades)."""
    top1 = float(np.mean([Y_real[i, np.argmax(P[i])] == 1 for i in range(len(P))]))
    top3 = float(np.mean([Y_real[i, np.argsort(P[i])[::-1][:3]].any() for i in range(len(P))]))
    pred = (P >= umbral).astype(int)

    por_enfermedad = {}
    for j, slug in enumerate(SLUGS):
        if Y_real[:, j].sum() == 0:
            continue
        auc = roc_auc_score(Y_real[:, j], P[:, j]) if 0 < Y_real[:, j].sum() < len(Y_real) else None
        tp = int(((pred[:, j] == 1) & (Y_real[:, j] == 1)).sum())
        por_enfermedad[slug] = {
            "soporte": int(Y_real[:, j].sum()),
            "recall": round(tp / Y_real[:, j].sum(), 3),
            "precision": round(tp / pred[:, j].sum(), 3) if pred[:, j].sum() else 0.0,
            "auc": None if auc is None else round(float(auc), 3),
        }
    return {
        "acierto_top1": round(top1, 3),
        "acierto_top3": round(top3, 3),
        "f1_macro": round(float(f1_score(Y_real, pred, average="macro", zero_division=0)), 3),
        "por_enfermedad": por_enfermedad,
    }
