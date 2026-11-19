"""Conversión de probabilidades a niveles de riesgo y armado de la respuesta."""
from .. import config
from ..catalogos import ENFERMEDADES


def nivel_riesgo(probabilidad: float) -> str:
    """Nivel mostrado al médico: Bajo / Medio / Alto."""
    if probabilidad >= config.UMBRAL_ALTO:
        return "Alto"
    if probabilidad >= config.UMBRAL_MEDIO:
        return "Medio"
    return "Bajo"


def nivel_riesgo_db(probabilidad: float) -> str:
    """Nivel para la tabla Alerta_Riesgo: agrega 'Crítico'."""
    if probabilidad >= config.UMBRAL_CRITICO:
        return "Crítico"
    return nivel_riesgo(probabilidad)


def armar_respuesta(probabilidades: dict, patrones: str, advertencias: list, top_n: int | None = None) -> dict:
    """`probabilidades`: {slug: float}. Devuelve el JSON de respuesta de la API."""
    top_n = top_n or config.TOP_N
    ordenadas = sorted(probabilidades.items(), key=lambda kv: kv[1], reverse=True)[:top_n]
    slug_max, p_max = ordenadas[0]
    p_max = round(float(p_max), 4)
    return {
        "resultado_prediccion": {
            "diagnostico_principal": ENFERMEDADES[slug_max],
            "nivel_riesgo": nivel_riesgo(p_max),
            "probabilidad_maxima": p_max,
            "matriz_probabilidades": [
                {"enfermedad": ENFERMEDADES[s], "probabilidad": round(float(p), 4)}
                for s, p in ordenadas
            ],
            "datos_para_tabla_alerta_riesgo": {
                "nivel_riesgo_db": nivel_riesgo_db(p_max),
                "patrones_detectados": patrones,
            },
            "advertencias": advertencias,
            "aviso": config.AVISO,
        }
    }
