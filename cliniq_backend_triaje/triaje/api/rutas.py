"""Endpoints de la API."""
import logging
import time

from flask import Blueprint, current_app, jsonify, request

from triaje import catalogos
from triaje.catalogos import AVISO
from triaje.dominio.validacion import validar_y_convertir

log = logging.getLogger("triaje")
bp = Blueprint("api", __name__)


@bp.get("/salud")
def salud():
    servicio = current_app.extensions["triaje"]
    return jsonify({"estado": "ok", "modelo_cargado": True,
                    "modelo_entrenado": servicio.meta.get("entrenado")})


@bp.get("/catalogos")
def get_catalogos():
    """Opciones para dibujar el formulario (motivos, alarmas, enfermedades...)."""
    return jsonify(catalogos.como_json())


@bp.post("/triaje")
def post_triaje():
    inicio = time.perf_counter()
    fila, error = validar_y_convertir(request.get_json(silent=True))
    if error:
        return jsonify({"error": error}), 400

    resultado = current_app.extensions["triaje"].clasificar(fila)
    resultado["aviso"] = AVISO

    # Solo metadatos: nada de datos clínicos en los logs
    log.info("triaje prioridad=%s origen=%s revision=%s ms=%.0f",
             resultado["prioridad"], resultado["origen"].split(" (")[0],
             resultado["requiere_revision"], (time.perf_counter() - inicio) * 1000)
    return jsonify(resultado)
