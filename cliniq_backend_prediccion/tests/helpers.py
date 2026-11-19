"""Datos de ejemplo reutilizables por los tests."""
import copy

ENTRADA_DIABETES = {
    "usuario": {"edad": 45, "genero": "M", "grupo_sanguineo": "O+", "peso_kg": 85, "altura_cm": 175},
    "sintomas": [
        {"nombre": "Sed excesiva", "severidad": "Alta"},
        {"nombre": "Micción frecuente", "severidad": "Moderada"},
        {"nombre": "Visión borrosa", "severidad": "Leve"},
    ],
    "diagnosticos": [{"descripcion": "Hipertensión arterial"}],
    "medicamentos": [{"nombre": "Losartán", "concentracion": "50 mg"}],
}

ENTRADA_ACNE = {
    "usuario": {"edad": 19, "genero": "F", "grupo_sanguineo": "A+", "peso_kg": 55, "altura_cm": 163},
    "sintomas": [{"nombre": "Granos o espinillas", "severidad": "Alta"},
                 {"nombre": "Enrojecimiento de la piel", "severidad": "Leve"}],
    "diagnosticos": [{"descripcion": "Acné vulgar"}],
    "medicamentos": [{"nombre": "Peróxido de benzoilo"}],
}


def copia(entrada: dict) -> dict:
    return copy.deepcopy(entrada)
