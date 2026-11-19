"""Fábrica de la aplicación Flask."""
from __future__ import annotations

import logging

from flask import Flask

from .api.rutas import bp
from .api.seguridad import registrar_seguridad
from .config import Settings
from .ml.servicio import ServicioTriaje


def create_app(settings: Settings | None = None) -> Flask:
    settings = settings or Settings.desde_entorno()

    logging.basicConfig(level=settings.log_level,
                        format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    app = Flask(__name__)
    app.json.ensure_ascii = False                  # tildes legibles en las respuestas
    app.json.sort_keys = False
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024   # el JSON de entrada es diminuto

    # Falla al arrancar (con mensaje claro) si el modelo falta o no es compatible
    app.extensions["triaje"] = ServicioTriaje.desde_archivo(
        settings.modelo_path, settings.umbral_confianza)
    app.extensions["triaje_settings"] = settings

    registrar_seguridad(app, settings)

    app.register_blueprint(bp, url_prefix="/api/v1")
    # Rutas antiguas sin prefijo (/triaje, /salud) para no romper un frontend existente
    app.register_blueprint(bp, url_prefix="", name="compat")
    return app
