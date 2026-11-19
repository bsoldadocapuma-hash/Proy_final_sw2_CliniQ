"""Utilidades de texto y conversión de entradas."""
import re
import unicodedata

SEVERIDAD_TEXTO = {1: "Leve", 2: "Moderada", 3: "Alta"}
_SEVERIDAD_MAP = {
    "leve": 1, "baja": 1, "moderada": 2, "media": 2, "moderado": 2,
    "alta": 3, "severa": 3, "grave": 3, "intensa": 3, "fuerte": 3,
}


def normalizar(texto) -> str:
    """Minúsculas, sin tildes ni signos, espacios simples."""
    texto = unicodedata.normalize("NFKD", str(texto or ""))
    texto = "".join(c for c in texto if not unicodedata.combining(c)).lower()
    texto = re.sub(r"[^a-z0-9\s+-]", " ", texto)
    return re.sub(r"\s+", " ", texto).strip()


def severidad_a_numero(valor) -> int:
    """Convierte 'Leve'/'Moderada'/'Alta' (o 1-3) a 1, 2 o 3. Sin dato -> 2."""
    if valor is None or valor == "":
        return 2
    if isinstance(valor, (int, float)):
        return int(min(3, max(1, round(valor))))
    s = normalizar(valor)
    if s.isdigit():
        return min(3, max(1, int(s)))
    return _SEVERIDAD_MAP.get(s, 2)


def calcular_imc(peso_kg: float, altura_cm: float) -> float:
    return round(peso_kg / ((altura_cm / 100.0) ** 2), 1)
