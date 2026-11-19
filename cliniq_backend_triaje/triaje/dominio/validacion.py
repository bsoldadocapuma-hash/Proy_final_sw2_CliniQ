"""Validación del JSON de entrada y conversión a una fila del modelo."""
from __future__ import annotations

import math

from triaje import catalogos as cat


def embarazo_no_aplica(sexo: str, edad: str) -> bool:
    """El embarazo no aplica a hombres ni a menores de 13 años."""
    return sexo == "M" or edad in cat.EDADES_SIN_EMBARAZO


def _casillas(datos: dict, campo: str, ids):
    """Lee una lista de casillas. Devuelve (conjunto_marcado, error)."""
    marcadas = datos.get(campo)
    if marcadas is None:
        marcadas = []
    if not isinstance(marcadas, list):
        return None, f"'{campo}' debe ser una lista."
    validas = set(ids) | {cat.VALOR_NINGUNA}
    for m in marcadas:
        if not isinstance(m, str) or m not in validas:
            return None, (f"Valor {m!r} inválido en '{campo}'. "
                          f"Consulta GET /api/v1/catalogos.")
    # Si viene "ninguna" junto a otras marcas, mandan las marcas.
    return set(marcadas) - {cat.VALOR_NINGUNA}, None


def _motivos(datos: dict):
    """Lee 'motivo_consulta': una lista (o un solo texto). Devuelve (ids, error)."""
    valor = datos.get("motivo_consulta", datos.get("motivos_consulta"))
    if isinstance(valor, str):
        valor = [valor]
    if not isinstance(valor, list) or not valor:
        return None, ("'motivo_consulta' es obligatorio: una lista con al menos un motivo. "
                      "Consulta GET /api/v1/catalogos")
    for m in valor:
        if not isinstance(m, str) or m not in cat.MOTIVO_POR_ID:
            return None, (f"Motivo {m!r} inválido en 'motivo_consulta'. "
                          f"Consulta GET /api/v1/catalogos")
    ids = list(dict.fromkeys(valor))          # quita repetidos, conserva el orden
    if len(ids) > cat.MAX_MOTIVOS:
        return None, f"Máximo {cat.MAX_MOTIVOS} motivos de consulta por caso."
    return ids, None


def validar_y_convertir(datos):
    """Devuelve (fila_dict, error). Si hay error, fila_dict es None."""
    if not isinstance(datos, dict):
        return None, "El cuerpo debe ser un objeto JSON."

    fila = {}

    # Variables categóricas (embarazo se trata aparte: depende de sexo y edad)
    for campo, permitidos in cat.VALORES.items():
        if campo == "embarazo":
            continue
        valor = datos.get(campo)
        if not isinstance(valor, str) or valor not in permitidos:
            return None, f"'{campo}' inválido o faltante. Permitidos: {permitidos}"
        fila[campo] = valor

    # Motivos de consulta (uno o varios)
    motivos, error = _motivos(datos)
    if error:
        return None, error
    for id_ in motivos:
        sexo_motivo = cat.MOTIVO_POR_ID[id_].sexo
        if sexo_motivo and sexo_motivo != fila["sexo"]:
            return None, f"El motivo '{id_}' solo aplica a sexo '{sexo_motivo}'."

    # Embarazo: no se pide a hombres ni a menores de 13; a mujeres sí.
    if embarazo_no_aplica(fila["sexo"], fila["edad"]):
        fila["embarazo"] = "no_aplica"
    elif datos.get("embarazo") in ("si", "no"):
        fila["embarazo"] = datos["embarazo"]
    else:
        return None, ("'embarazo' es obligatorio para mujeres de 13 años o más. "
                      "Permitidos: ['si', 'no']")

    # Intensidad: número 0-10 o texto (leve / moderado / muy_fuerte)
    intensidad = datos.get("intensidad")
    if isinstance(intensidad, str) and intensidad in cat.INTENSIDAD_TEXTO:
        intensidad = cat.INTENSIDAD_TEXTO[intensidad]
    if (isinstance(intensidad, bool) or not isinstance(intensidad, (int, float))
            or not 0 <= intensidad <= 10):
        return None, ("'intensidad' debe ser un número de 0 a 10 "
                      "o: leve, moderado, muy_fuerte")
    fila["intensidad"] = float(intensidad)

    # Temperatura: opcional. Vacía = NaN (el imputador del modelo la rellena).
    temp = datos.get("temperatura")
    if temp is None or temp == "":
        fila["temperatura"] = math.nan
    elif (isinstance(temp, bool) or not isinstance(temp, (int, float))
          or not 34 <= temp <= 42):
        return None, "'temperatura' debe estar entre 34 y 42 °C (o vacía)."
    else:
        fila["temperatura"] = float(temp)

    # Casillas: señales de alarma y enfermedades
    alarmas, error = _casillas(datos, "senales_alarma", cat.COLUMNA_ALARMA)
    if error:
        return None, error
    enfermedades, error = _casillas(datos, "enfermedades", cat.COLUMNA_ENFERMEDAD)
    if error:
        return None, error

    for id_alarma in alarmas:
        sexo_alarma = cat.ALARMA_POR_ID[id_alarma].sexo
        if sexo_alarma and sexo_alarma != fila["sexo"]:
            return None, f"La señal '{id_alarma}' solo aplica a sexo '{sexo_alarma}'."

    for id_, columna in cat.COLUMNA_MOTIVO.items():
        fila[columna] = 1 if id_ in motivos else 0
    for id_, columna in cat.COLUMNA_ALARMA.items():
        fila[columna] = 1 if id_ in alarmas else 0
    for id_, columna in cat.COLUMNA_ENFERMEDAD.items():
        fila[columna] = 1 if id_ in enfermedades else 0

    return fila, None
