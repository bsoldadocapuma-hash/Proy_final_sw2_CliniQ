"""Guardar y cargar los modelos entrenados, con comprobaciones de compatibilidad."""
from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import sklearn

from triaje import catalogos as cat


class ModeloNoDisponible(RuntimeError):
    """El archivo del modelo no existe o no es compatible con este entorno."""


def guardar(modelos: dict, n_filas: int, ruta: Path) -> None:
    bundle = {
        "modelos": modelos,
        "meta": {
            "sklearn": sklearn.__version__,
            "features": cat.FEATURES,
            "catalogo": cat.huella(),
            "n_filas": n_filas,
            "entrenado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        },
    }
    ruta = Path(ruta)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    tmp = ruta.with_name(ruta.name + ".tmp")
    joblib.dump(bundle, tmp)
    os.replace(tmp, ruta)          # escritura atómica: nunca queda un archivo a medias


def cargar(ruta: Path):
    """Devuelve (modelos, meta). Falla con un mensaje claro si no es compatible."""
    ruta = Path(ruta)
    if not ruta.exists():
        raise ModeloNoDisponible(
            f"No existe el modelo ({ruta}). Ejecuta primero:  python manage.py entrenar")

    bundle = joblib.load(ruta)
    if not isinstance(bundle, dict) or "modelos" not in bundle:
        raise ModeloNoDisponible("Formato de modelo antiguo. "
                                 "Ejecuta:  python manage.py entrenar")
    modelos, meta = bundle["modelos"], bundle.get("meta", {})

    version = meta.get("sklearn", "")
    if version.split(".")[:2] != sklearn.__version__.split(".")[:2]:
        raise ModeloNoDisponible(
            f"El modelo se entrenó con scikit-learn {version} pero aquí hay "
            f"{sklearn.__version__}. Fija la misma versión en requirements.txt "
            f"o reentrena en este entorno (python manage.py entrenar).")
    if meta.get("features") != cat.FEATURES or meta.get("catalogo") != cat.huella():
        raise ModeloNoDisponible("Los catálogos cambiaron desde que se entrenó el modelo. "
                                 "Ejecuta:  python manage.py entrenar")

    desconocidas = set(modelos["prioridad"].classes_) - set(cat.ORDEN_PRIORIDAD)
    if desconocidas:
        raise ModeloNoDisponible(f"El modelo tiene prioridades inválidas: {desconocidas}")
    return modelos, meta
