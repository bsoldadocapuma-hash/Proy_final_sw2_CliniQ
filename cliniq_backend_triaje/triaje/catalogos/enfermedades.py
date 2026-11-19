"""Enfermedades o condiciones previas (24).

El frontend puede guardarlas como valores por defecto del paciente y enviarlas
siempre en `enfermedades`.

  riesgo  True si la condición suele aumentar la gravedad (la usa el generador
          de datos sintéticos; el modelo real aprende de tu CSV).
"""
from typing import NamedTuple


class Enfermedad(NamedTuple):
    id: str
    etiqueta: str
    riesgo: bool = False


ENFERMEDADES = [
    Enfermedad("diabetes", "Diabetes"),
    Enfermedad("hipertension", "Hipertensión (presión alta)"),
    Enfermedad("corazon", "Enfermedad del corazón (infarto previo, insuficiencia cardíaca, arritmia)", True),
    Enfermedad("asma_epoc", "Asma o EPOC"),
    Enfermedad("anticoagulantes", "Toma anticoagulantes (\"adelgazantes de la sangre\")", True),
    Enfermedad("insuficiencia_renal", "Enfermedad renal o diálisis", True),
    Enfermedad("enfermedad_hepatica", "Enfermedad del hígado (cirrosis, hepatitis)", True),
    Enfermedad("cancer", "Cáncer (actual o en tratamiento)", True),
    Enfermedad("inmunosupresion", "Defensas bajas (VIH, trasplante, quimioterapia, corticoides)", True),
    Enfermedad("epilepsia", "Epilepsia"),
    Enfermedad("acv_previo", "Derrame o ACV previo", True),
    Enfermedad("obesidad", "Obesidad"),
    Enfermedad("tuberculosis", "Tuberculosis (actual o en tratamiento)"),
    Enfermedad("chagas", "Enfermedad de Chagas"),
    Enfermedad("tiroides", "Enfermedad de la tiroides"),
    Enfermedad("anemia", "Anemia"),
    Enfermedad("gastritis_ulcera", "Gastritis o úlcera"),
    Enfermedad("artritis", "Artritis o artrosis"),
    Enfermedad("salud_mental", "Depresión, ansiedad u otro trastorno mental"),
    Enfermedad("alergia_medicamentos", "Alergia a medicamentos"),
    Enfermedad("tabaquismo", "Fuma"),
    Enfermedad("alcohol_drogas", "Consumo problemático de alcohol o drogas"),
    Enfermedad("colesterol_alto", "Colesterol o triglicéridos altos"),
    Enfermedad("trastorno_coagulacion", "Trastorno de la coagulación (hemofilia u otro)", True),
]
