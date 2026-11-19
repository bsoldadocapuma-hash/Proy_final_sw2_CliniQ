from .diagnosticos import DIAGNOSTICOS
from .enfermedades import ENFERMEDADES, NOMBRE_A_SLUG, SLUGS
from .medicamentos import CLASES, MEDICAMENTOS, NOMBRE_CLASE
from .sintomas import SINTOMAS

GRUPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

__all__ = [
    "DIAGNOSTICOS", "ENFERMEDADES", "NOMBRE_A_SLUG", "SLUGS", "CLASES",
    "MEDICAMENTOS", "NOMBRE_CLASE", "SINTOMAS", "GRUPOS_SANGUINEOS",
]
