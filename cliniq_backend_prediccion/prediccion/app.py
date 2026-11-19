"""Punto de entrada. Ejecutar con:  uvicorn prediccion.app:app --reload --port 8001"""
from fastapi import FastAPI

from .api import router


def crear_app() -> FastAPI:
    app = FastAPI(
        title="ClinIQ - Predicción de enfermedades",
        description="Sugiere enfermedades probables a partir de síntomas, diagnósticos, "
                    "medicamentos y datos del paciente. Apoyo a la decisión clínica, no diagnóstico.",
        version="1.0.0",
    )
    app.include_router(router)
    return app


app = crear_app()
