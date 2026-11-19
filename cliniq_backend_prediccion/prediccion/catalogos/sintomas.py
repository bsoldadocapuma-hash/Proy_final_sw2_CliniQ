"""Catálogo de síntomas (tabla `sintoma`).

Los nombres deben coincidir con los que se guardan en la BD. La comparación
ignora mayúsculas y tildes, pero un síntoma que no esté aquí no entra al modelo
(la API lo reporta en `advertencias`).
"""

SINTOMAS = [
    # General
    "Fiebre", "Fatiga", "Pérdida de peso", "Aumento de peso", "Pérdida de apetito",
    # Cardiometabólico
    "Dolor de cabeza", "Mareo", "Visión borrosa", "Palpitaciones", "Dolor de pecho",
    "Sed excesiva", "Micción frecuente", "Hambre excesiva", "Hormigueo en extremidades",
    "Heridas de cicatrización lenta", "Sudoración excesiva",
    # Gastrointestinal
    "Diarrea", "Vómitos", "Náuseas", "Dolor abdominal", "Distensión abdominal",
    "Acidez", "Sangre en heces", "Estreñimiento", "Deshidratación",
    # Respiratorio
    "Tos", "Disnea", "Sibilancias", "Dolor de garganta", "Congestión nasal",
    "Expectoración", "Pérdida de olfato", "Opresión torácica",
    # Piel
    "Picazón", "Erupción cutánea", "Piel seca", "Lesiones con descamación",
    "Manchas blancas en la piel", "Granos o espinillas", "Enrojecimiento de la piel",
    "Ampollas",
    # Renal
    "Orina espumosa", "Hinchazón de piernas", "Disminución de orina", "Sangre en orina",
    # Musculoesquelético
    "Dolor de tobillo", "Dolor de pie", "Hinchazón de tobillo", "Dolor de espalda",
    "Dolor lumbar", "Dolor de cuello", "Dolor irradiado a pierna", "Rigidez articular",
    "Dolor de muñeca", "Dolor de mano", "Entumecimiento de mano", "Limitación de movimiento",
    "Dolor de antebrazo", "Traumatismo",
    # Neuropsicológico
    "Ansiedad", "Insomnio", "Dificultad de concentración", "Pérdida de memoria",
    "Irritabilidad", "Tristeza persistente", "Dificultades de aprendizaje",
    "Cambios de conducta",
    # Dolor crónico
    "Dolor persistente", "Dolor neuropático (quemazón)", "Dolor muscular generalizado",
    # Post-COVID
    "Fatiga persistente", "Niebla mental",
    # Toxicología
    "Ingesta de sustancia tóxica", "Pupilas alteradas", "Confusión",
    "Salivación excesiva", "Convulsiones", "Contacto con químicos",
]
