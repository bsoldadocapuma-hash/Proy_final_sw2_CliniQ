"""Utilidades sobre los colores de prioridad."""
from triaje.catalogos import ORDEN_PRIORIDAD


def gravedad(color: str) -> int:
    """0 = rojo (más grave) ... 4 = azul (menos grave)."""
    return ORDEN_PRIORIDAD.index(color)


def subir_un_nivel(color: str) -> str:
    """Sube un nivel de gravedad, sin pasar de naranja (el rojo solo lo dan las reglas)."""
    idx = gravedad(color)
    if idx > gravedad("naranja"):
        idx -= 1
    return ORDEN_PRIORIDAD[idx]
