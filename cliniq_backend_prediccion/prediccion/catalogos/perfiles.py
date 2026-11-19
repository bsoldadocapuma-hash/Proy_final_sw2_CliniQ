"""Perfiles clínicos SINTÉTICOS usados solo por el generador de dataset.

No son datos reales de la clínica: son reglas plausibles (qué síntomas,
diagnósticos previos y medicamentos suelen acompañar a cada enfermedad) para
poder entrenar y probar el pipeline mientras no existan datos propios.
Cuando tengas historial real exportado de la BD, este archivo deja de ser necesario.

Formato de `sintomas`: {"Síntoma": (probabilidad, severidad_media_1_a_3)}
Formato de `dx` y `meds`: {etiqueta_o_clase: probabilidad}
"""

PERFILES = {
    "hipertension": {
        "edad": (55, 12), "prob_m": 0.5, "imc": (28, 4),
        "sintomas": {"Dolor de cabeza": (0.6, 2), "Mareo": (0.5, 2), "Visión borrosa": (0.25, 2),
                     "Palpitaciones": (0.3, 2), "Dolor de pecho": (0.2, 2.5), "Fatiga": (0.3, 1.5)},
        "dx": {"hipertension": 0.85, "dislipidemia": 0.25},
        "meds": {"antihipertensivo": 0.85, "diuretico": 0.3, "hipolipemiante": 0.2},
    },
    "diabetes": {
        "edad": (54, 13), "prob_m": 0.5, "imc": (30, 5),
        "sintomas": {"Sed excesiva": (0.75, 2.5), "Micción frecuente": (0.7, 2), "Hambre excesiva": (0.4, 2),
                     "Pérdida de peso": (0.3, 2), "Visión borrosa": (0.35, 2),
                     "Hormigueo en extremidades": (0.4, 2), "Heridas de cicatrización lenta": (0.3, 2),
                     "Fatiga": (0.5, 2)},
        "dx": {"diabetes": 0.85, "hipertension": 0.3, "obesidad": 0.25},
        "meds": {"antidiabetico": 0.85, "hipolipemiante": 0.3},
    },
    "sindrome_metabolico": {
        "edad": (52, 11), "prob_m": 0.5, "imc": (32, 4),
        "sintomas": {"Fatiga": (0.5, 2), "Aumento de peso": (0.5, 2), "Sed excesiva": (0.2, 1.5),
                     "Dolor de cabeza": (0.2, 1.5), "Mareo": (0.15, 1.5)},
        "dx": {"sindrome_metabolico": 0.6, "dislipidemia": 0.6, "hipertension": 0.5,
               "diabetes": 0.3, "obesidad": 0.5},
        "meds": {"antihipertensivo": 0.5, "antidiabetico": 0.4, "hipolipemiante": 0.6},
    },
    "obesidad": {
        "edad": (40, 13), "prob_m": 0.45, "imc": (35, 4),
        "sintomas": {"Aumento de peso": (0.7, 2), "Fatiga": (0.6, 2), "Disnea": (0.35, 2),
                     "Dolor de espalda": (0.3, 2), "Sudoración excesiva": (0.3, 1.5)},
        "dx": {"obesidad": 0.85, "sindrome_metabolico": 0.15},
        "meds": {"hipolipemiante": 0.1},
    },
    "infeccion_gi": {
        "edad": (32, 18), "prob_m": 0.5, "imc": (25, 4),
        "sintomas": {"Diarrea": (0.85, 2.5), "Vómitos": (0.6, 2), "Náuseas": (0.6, 2),
                     "Dolor abdominal": (0.7, 2.5), "Fiebre": (0.5, 2), "Deshidratación": (0.3, 2.5)},
        "dx": {"gastroenteritis": 0.8},
        "meds": {"antidiarreico": 0.3, "antibiotico": 0.4, "analgesico": 0.3},
    },
    "post_covid": {
        "edad": (42, 13), "prob_m": 0.45, "imc": (26, 4),
        "sintomas": {"Fatiga persistente": (0.8, 2.5), "Niebla mental": (0.6, 2), "Disnea": (0.5, 2),
                     "Pérdida de olfato": (0.3, 1.5), "Tos": (0.35, 1.5), "Palpitaciones": (0.3, 2),
                     "Insomnio": (0.3, 2), "Dolor muscular generalizado": (0.3, 2)},
        "dx": {"covid_previo": 0.9},
        "meds": {"corticoide": 0.2, "analgesico": 0.3},
    },
    "acne": {
        "edad": (20, 6), "prob_m": 0.45, "imc": (23, 3),
        "sintomas": {"Granos o espinillas": (0.95, 2), "Enrojecimiento de la piel": (0.5, 1.5),
                     "Piel seca": (0.2, 1.5), "Picazón": (0.15, 1.5)},
        "dx": {"acne": 0.9},
        "meds": {"antiacneico": 0.8, "antibiotico": 0.25},
    },
    "eccema": {
        "edad": (25, 18), "prob_m": 0.45, "imc": (24, 4),
        "sintomas": {"Picazón": (0.9, 2.5), "Piel seca": (0.7, 2), "Erupción cutánea": (0.6, 2),
                     "Enrojecimiento de la piel": (0.5, 2), "Ampollas": (0.15, 1.5)},
        "dx": {"eccema": 0.85},
        "meds": {"corticoide_topico": 0.7, "antihistaminico": 0.5, "inmunomodulador": 0.2},
    },
    "psoriasis": {
        "edad": (40, 15), "prob_m": 0.5, "imc": (27, 4),
        "sintomas": {"Lesiones con descamación": (0.9, 2.5), "Picazón": (0.5, 2),
                     "Enrojecimiento de la piel": (0.6, 2), "Rigidez articular": (0.2, 2)},
        "dx": {"psoriasis": 0.9},
        "meds": {"corticoide_topico": 0.55, "inmunomodulador": 0.5},
    },
    "vitiligo": {
        "edad": (30, 14), "prob_m": 0.45, "imc": (24, 4),
        "sintomas": {"Manchas blancas en la piel": (0.98, 2), "Picazón": (0.1, 1)},
        "dx": {"vitiligo": 0.9},
        "meds": {"inmunomodulador": 0.5, "corticoide_topico": 0.4},
    },
    "dermatitis": {
        "edad": (34, 18), "prob_m": 0.45, "imc": (25, 4),
        "sintomas": {"Erupción cutánea": (0.8, 2), "Picazón": (0.8, 2), "Enrojecimiento de la piel": (0.7, 2),
                     "Ampollas": (0.3, 2), "Piel seca": (0.3, 1.5)},
        "dx": {"dermatitis": 0.85},
        "meds": {"corticoide_topico": 0.6, "antihistaminico": 0.6},
    },
    "renal": {
        "edad": (58, 15), "prob_m": 0.55, "imc": (27, 5),
        "sintomas": {"Orina espumosa": (0.5, 2), "Hinchazón de piernas": (0.6, 2),
                     "Disminución de orina": (0.45, 2.5), "Sangre en orina": (0.25, 2.5),
                     "Fatiga": (0.6, 2), "Náuseas": (0.35, 2), "Dolor lumbar": (0.35, 2),
                     "Pérdida de apetito": (0.3, 2)},
        "dx": {"enfermedad_renal": 0.85, "hipertension": 0.5, "diabetes": 0.35},
        "meds": {"diuretico": 0.5, "antihipertensivo": 0.5},
    },
    "gastro": {
        "edad": (42, 15), "prob_m": 0.45, "imc": (26, 4),
        "sintomas": {"Acidez": (0.7, 2), "Dolor abdominal": (0.7, 2), "Distensión abdominal": (0.55, 2),
                     "Náuseas": (0.4, 2), "Estreñimiento": (0.35, 1.5), "Sangre en heces": (0.1, 3),
                     "Pérdida de apetito": (0.2, 1.5)},
        "dx": {"gastritis": 0.5, "reflujo": 0.4},
        "meds": {"inhibidor_acido": 0.8, "analgesico": 0.1},
    },
    "pie_tobillo": {
        "edad": (38, 16), "prob_m": 0.5, "imc": (26, 4),
        "sintomas": {"Dolor de tobillo": (0.7, 2.5), "Dolor de pie": (0.7, 2.5), "Hinchazón de tobillo": (0.6, 2),
                     "Limitación de movimiento": (0.5, 2), "Traumatismo": (0.45, 2)},
        "dx": {"esguince": 0.5, "fractura": 0.15},
        "meds": {"aine": 0.7, "analgesico": 0.4},
    },
    "columna": {
        "edad": (50, 14), "prob_m": 0.45, "imc": (28, 4),
        "sintomas": {"Dolor lumbar": (0.7, 2.5), "Dolor de espalda": (0.6, 2.5),
                     "Dolor irradiado a pierna": (0.45, 2.5), "Dolor de cuello": (0.3, 2),
                     "Rigidez articular": (0.35, 2), "Hormigueo en extremidades": (0.25, 2)},
        "dx": {"lumbalgia": 0.5, "hernia_discal": 0.4},
        "meds": {"aine": 0.6, "relajante_muscular": 0.5, "analgesico_neuropatico": 0.25},
    },
    "mano_muneca": {
        "edad": (40, 15), "prob_m": 0.5, "imc": (26, 4),
        "sintomas": {"Dolor de muñeca": (0.7, 2.5), "Dolor de mano": (0.6, 2), "Dolor de antebrazo": (0.45, 2),
                     "Entumecimiento de mano": (0.45, 2), "Limitación de movimiento": (0.4, 2),
                     "Traumatismo": (0.35, 2)},
        "dx": {"tunel_carpiano": 0.35, "fractura": 0.25, "esguince": 0.15},
        "meds": {"aine": 0.6, "analgesico": 0.3},
    },
    "neuropsico": {
        "edad": (22, 14), "prob_m": 0.5, "imc": (23, 4),
        "sintomas": {"Ansiedad": (0.6, 2), "Insomnio": (0.5, 2), "Dificultad de concentración": (0.65, 2),
                     "Irritabilidad": (0.5, 2), "Pérdida de memoria": (0.25, 2),
                     "Tristeza persistente": (0.4, 2), "Dificultades de aprendizaje": (0.3, 2),
                     "Cambios de conducta": (0.35, 2)},
        "dx": {"ansiedad": 0.4, "depresion": 0.3, "tdah": 0.3},
        "meds": {"psicofarmaco": 0.4},
    },
    "dolor_cronico": {
        "edad": (55, 15), "prob_m": 0.4, "imc": (27, 5),
        "sintomas": {"Dolor persistente": (0.95, 2.5), "Dolor neuropático (quemazón)": (0.4, 2.5),
                     "Dolor muscular generalizado": (0.4, 2), "Insomnio": (0.35, 2),
                     "Fatiga": (0.4, 2), "Tristeza persistente": (0.15, 2)},
        "dx": {"dolor_cronico": 0.8},
        "meds": {"analgesico_neuropatico": 0.5, "opioide": 0.3, "aine": 0.4},
    },
    "respiratorias": {
        "edad": (45, 22), "prob_m": 0.5, "imc": (26, 5),
        "sintomas": {"Tos": (0.85, 2), "Disnea": (0.65, 2.5), "Sibilancias": (0.5, 2),
                     "Expectoración": (0.5, 2), "Opresión torácica": (0.35, 2), "Fiebre": (0.3, 2),
                     "Dolor de garganta": (0.2, 1.5), "Congestión nasal": (0.25, 1.5)},
        "dx": {"asma": 0.3, "epoc": 0.2, "neumonia": 0.15, "infeccion_respiratoria": 0.3},
        "meds": {"broncodilatador": 0.55, "corticoide": 0.3, "antibiotico": 0.3},
    },
    "intoxicaciones": {
        "edad": (28, 18), "prob_m": 0.5, "imc": (24, 4),
        "sintomas": {"Ingesta de sustancia tóxica": (0.8, 3), "Vómitos": (0.65, 2.5), "Náuseas": (0.5, 2),
                     "Confusión": (0.45, 2.5), "Pupilas alteradas": (0.3, 2), "Salivación excesiva": (0.3, 2),
                     "Convulsiones": (0.15, 3), "Dolor abdominal": (0.4, 2.5), "Contacto con químicos": (0.35, 2.5)},
        "dx": {"intoxicacion": 0.85},
        "meds": {"antidoto": 0.5},
    },
}

# Enfermedad principal -> {enfermedad secundaria: probabilidad de coexistir}
COMORBILIDAD = {
    "diabetes": {"sindrome_metabolico": 0.35, "obesidad": 0.4, "hipertension": 0.4, "renal": 0.12},
    "hipertension": {"sindrome_metabolico": 0.25, "obesidad": 0.3, "diabetes": 0.2, "renal": 0.1},
    "sindrome_metabolico": {"diabetes": 0.35, "hipertension": 0.5, "obesidad": 0.5},
    "obesidad": {"sindrome_metabolico": 0.3, "hipertension": 0.3, "diabetes": 0.2, "columna": 0.1},
    "renal": {"hipertension": 0.4, "diabetes": 0.3},
    "infeccion_gi": {"gastro": 0.15},
    "gastro": {"infeccion_gi": 0.1},
    "post_covid": {"respiratorias": 0.25},
    "respiratorias": {"post_covid": 0.1},
    "eccema": {"dermatitis": 0.15},
    "dermatitis": {"eccema": 0.1},
    "dolor_cronico": {"columna": 0.25, "neuropsico": 0.1},
    "columna": {"dolor_cronico": 0.2},
    "neuropsico": {"dolor_cronico": 0.08},
}
