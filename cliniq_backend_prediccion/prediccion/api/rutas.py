from fastapi import APIRouter, HTTPException

from ..catalogos import ENFERMEDADES, GRUPOS_SANGUINEOS, SINTOMAS
from ..dominio.validacion import EntradaInvalida
from ..ml.predictor import ModeloNoEntrenado, predictor
from .esquemas import PrediccionIn

router = APIRouter()


@router.get("/salud", tags=["sistema"])
def salud():
    try:
        b = predictor.bundle
        return {"estado": "ok", "modelo_cargado": True, "entrenado_en": b["entrenado_en"],
                "filas_entrenamiento": b["filas_entrenamiento"]}
    except ModeloNoEntrenado:
        return {"estado": "sin_modelo", "modelo_cargado": False}


@router.get("/catalogos/enfermedades", tags=["catalogos"])
def catalogo_enfermedades():
    return [{"id": slug, "nombre": nombre} for slug, nombre in ENFERMEDADES.items()]


@router.get("/catalogos/sintomas", tags=["catalogos"])
def catalogo_sintomas():
    return SINTOMAS


@router.get("/catalogos/grupos-sanguineos", tags=["catalogos"])
def catalogo_grupos():
    return GRUPOS_SANGUINEOS


@router.post("/prediccion-enfermedad", tags=["prediccion"])
def prediccion_enfermedad(datos: PrediccionIn):
    """Devuelve las enfermedades más probables para el paciente (apoyo a la decisión, no diagnóstico)."""
    try:
        return predictor.predecir(datos.model_dump())
    except EntradaInvalida as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ModeloNoEntrenado as e:
        raise HTTPException(status_code=503, detail=str(e))
