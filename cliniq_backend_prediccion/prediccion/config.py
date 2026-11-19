"""Configuración central. Se puede sobrescribir con variables de entorno o un archivo .env."""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:  # python-dotenv es opcional
    pass

RAIZ = Path(__file__).resolve().parent.parent

RUTA_DATASET = Path(os.getenv("RUTA_DATASET", RAIZ / "data" / "dataset_prediccion.csv"))
RUTA_MODELO = Path(os.getenv("RUTA_MODELO", RAIZ / "models" / "modelo_prediccion.joblib"))
RUTA_METRICAS = Path(os.getenv("RUTA_METRICAS", RAIZ / "models" / "metricas.json"))

SEMILLA = int(os.getenv("SEMILLA", "42"))
# Regularización de la regresión logística (menor = más suave)
REGULARIZACION_C = float(os.getenv("REGULARIZACION_C", "0.3"))

# Cuántas enfermedades devuelve la matriz de probabilidades
TOP_N = int(os.getenv("TOP_N", "5"))

# Umbrales sobre la probabilidad máxima
UMBRAL_MEDIO = float(os.getenv("UMBRAL_MEDIO", "0.40"))
UMBRAL_ALTO = float(os.getenv("UMBRAL_ALTO", "0.70"))
UMBRAL_CRITICO = float(os.getenv("UMBRAL_CRITICO", "0.90"))

AVISO = (
    "Sugerencia de apoyo a la decisión clínica generada por un modelo de aprendizaje "
    "automático. No constituye un diagnóstico: el diagnóstico definitivo lo confirma el médico."
)
