"""Reglas de validación de los datos del paciente."""
from ..catalogos import GRUPOS_SANGUINEOS
from .normalizacion import normalizar


class EntradaInvalida(ValueError):
    """Los datos recibidos no cumplen las reglas del dominio."""


def normalizar_genero(valor) -> str:
    g = normalizar(valor)
    if g in ("m", "masculino", "hombre", "male"):
        return "M"
    if g in ("f", "femenino", "mujer", "female"):
        return "F"
    raise EntradaInvalida("genero debe ser 'M' o 'F'")


def normalizar_grupo_sanguineo(valor):
    """Devuelve el grupo en formato 'O+' o None si no se informó."""
    if valor in (None, ""):
        return None
    g = str(valor).strip().upper().replace(" ", "")
    if g not in GRUPOS_SANGUINEOS:
        raise EntradaInvalida(f"grupo_sanguineo inválido: {valor!r}. Válidos: {GRUPOS_SANGUINEOS}")
    return g


def validar_usuario(usuario: dict) -> dict:
    """Valida y normaliza los datos del usuario. Devuelve una copia limpia."""
    try:
        edad = float(usuario["edad"])
        peso = float(usuario["peso_kg"])
        altura = float(usuario["altura_cm"])
    except (KeyError, TypeError, ValueError):
        raise EntradaInvalida("edad, peso_kg y altura_cm son obligatorios y numéricos")
    if not 0 <= edad <= 120:
        raise EntradaInvalida("edad fuera de rango (0-120)")
    if not 2 <= peso <= 400:
        raise EntradaInvalida("peso_kg fuera de rango (2-400)")
    if not 40 <= altura <= 250:
        raise EntradaInvalida("altura_cm fuera de rango (40-250)")
    return {
        "edad": edad,
        "genero": normalizar_genero(usuario.get("genero")),
        "grupo_sanguineo": normalizar_grupo_sanguineo(usuario.get("grupo_sanguineo")),
        "peso_kg": peso,
        "altura_cm": altura,
    }
