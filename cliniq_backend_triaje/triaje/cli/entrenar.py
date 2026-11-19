"""Entrena los dos modelos del triaje a partir del CSV y los guarda en models/."""
import pandas as pd
import sklearn

from triaje import catalogos as cat
from triaje.config import Settings
from triaje.ml import almacen
from triaje.ml.dataset import DatasetInvalido, cargar_dataset
from triaje.ml.pipeline import entrenar_modelos


def main() -> None:
    settings = Settings.desde_entorno()
    try:
        datos = cargar_dataset(settings.dataset_path)
    except DatasetInvalido as e:
        raise SystemExit(str(e))

    print(f"Filas: {len(datos)}")
    print(datos[cat.OBJETIVO_PRIORIDAD].value_counts().reindex(cat.ORDEN_PRIORIDAD)
          .fillna(0).astype(int).to_string(), "\n")

    modelos = entrenar_modelos(datos)
    almacen.guardar(modelos, len(datos), settings.modelo_path)

    print(f"Modelos guardados en {settings.modelo_path}")
    if len(datos) < 200:
        print(f"Dataset pequeño ({len(datos)} filas): las métricas de evaluar serán "
              f"poco fiables. Apunta a 200 filas o más.")
    print("Siguiente paso:  python manage.py evaluar")
    print(f"Para Azure, fija en requirements.txt:  scikit-learn=={sklearn.__version__}"
          f"  pandas=={pd.__version__}")
