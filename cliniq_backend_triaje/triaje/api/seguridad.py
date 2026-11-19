"""API key, CORS y manejo de errores en JSON."""
import hmac
import logging

from flask import jsonify, request
from werkzeug.exceptions import HTTPException

log = logging.getLogger("triaje")


def registrar_seguridad(app, settings) -> None:
    if settings.cors_origenes:
        from flask_cors import CORS
        CORS(app, origins=list(settings.cors_origenes), methods=["GET", "POST", "OPTIONS"],
             allow_headers=["Content-Type", "X-API-Key"])

    @app.before_request
    def verificar_api_key():
        """Si API_KEY está definida, todo (salvo /salud) exige la cabecera X-API-Key."""
        if (not settings.api_key or request.method == "OPTIONS"
                or request.path.rstrip("/").endswith("/salud")):
            return None
        enviada = request.headers.get("X-API-Key", "")
        if not hmac.compare_digest(enviada.encode(), settings.api_key.encode()):
            return jsonify({"error": "No autorizado."}), 401
        return None

    @app.errorhandler(HTTPException)
    def error_http(e):
        return jsonify({"error": e.description}), e.code

    @app.errorhandler(Exception)
    def error_interno(e):
        log.exception("Error no controlado")   # el JSON del paciente NO se registra
        return jsonify({"error": "Error interno del servidor."}), 500
