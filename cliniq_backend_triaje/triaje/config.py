"""Configuración. Todo se puede cambiar con variables de entorno.

En local: copia `.env.example` a `.env`. En Azure: "App settings".
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

try:  # opcional: carga el archivo .env si python-dotenv está instalado
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / ".env")
except ImportError:
    pass

UMBRAL_POR_DEFECTO = 0.60


def _ruta(variable: str, defecto: Path) -> Path:
    valor = os.getenv(variable)
    if not valor:
        return defecto
    ruta = Path(valor)
    return ruta if ruta.is_absolute() else BASE_DIR / ruta


@dataclass(frozen=True)
class Settings:
    modelo_path: Path
    dataset_path: Path
    # Si la confianza del modelo es menor, se sube un nivel (nunca a rojo) y se
    # marca "requiere_revision". Ajústalo con:  python manage.py evaluar
    umbral_confianza: float = UMBRAL_POR_DEFECTO
    # Si se define, la API exige la cabecera X-API-Key (salvo en /salud).
    api_key: str = ""
    # Orígenes CORS permitidos. Vacío = CORS desactivado.
    cors_origenes: tuple[str, ...] = ()
    log_level: str = "INFO"

    @classmethod
    def desde_entorno(cls) -> "Settings":
        umbral = float(os.getenv("UMBRAL_CONFIANZA", str(UMBRAL_POR_DEFECTO)))
        if not 0 <= umbral <= 1:
            raise ValueError("UMBRAL_CONFIANZA debe estar entre 0 y 1.")
        origenes = tuple(o.strip() for o in os.getenv("CORS_ORIGENES", "").split(",")
                         if o.strip())
        return cls(
            modelo_path=_ruta("MODELO_PATH", BASE_DIR / "models" / "modelos_triaje.joblib"),
            dataset_path=_ruta("DATASET_PATH", BASE_DIR / "data" / "dataset_triaje.csv"),
            umbral_confianza=umbral,
            api_key=os.getenv("API_KEY", ""),
            cors_origenes=origenes,
            log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
        )
