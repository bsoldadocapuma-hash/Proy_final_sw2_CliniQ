"""Utilidades de prueba: entrena un modelo pequeño una sola vez, en una carpeta temporal."""
import atexit
import shutil
import tempfile
from functools import lru_cache
from pathlib import Path

from triaje.cli.generar_dataset import generar_dataframe
from triaje.config import Settings
from triaje.ml import almacen
from triaje.ml.pipeline import entrenar_modelos


@lru_cache(maxsize=1)
def carpeta_modelo() -> Path:
    carpeta = Path(tempfile.mkdtemp(prefix="triaje_test_"))
    atexit.register(shutil.rmtree, carpeta, ignore_errors=True)
    datos = generar_dataframe(900, semilla=7)
    almacen.guardar(entrenar_modelos(datos), len(datos), carpeta / "modelo.joblib")
    return carpeta


def settings_de_prueba(**cambios) -> Settings:
    base = dict(modelo_path=carpeta_modelo() / "modelo.joblib",
                dataset_path=carpeta_modelo() / "no_se_usa.csv",
                umbral_confianza=0.60, api_key="", cors_origenes=(), log_level="WARNING")
    base.update(cambios)
    return Settings(**base)


BASE = {
    "edad": "18_64", "sexo": "F", "embarazo": "no",
    "motivo_consulta": "fiebre", "senales_alarma": ["ninguna"],
    "intensidad": 3, "inicio": "poco_a_poco", "duracion": "1_dia",
    "evolucion": "igual", "enfermedades": ["ninguna"], "temperatura": 38.2,
}


def caso(**cambios):
    """Caso base con cambios; el valor "__quitar__" elimina la clave."""
    d = dict(BASE)
    d.update(cambios)
    return {k: v for k, v in d.items() if v != "__quitar__"}
