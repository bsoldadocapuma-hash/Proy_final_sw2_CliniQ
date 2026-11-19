"""Catálogo de enfermedades que el modelo puede sugerir.

El orden de esta lista define el orden de las columnas de salida del modelo.
Para agregar una enfermedad: añádela aquí, defínele un perfil en perfiles.py,
regenera el dataset y vuelve a entrenar.
"""

ENFERMEDADES = {
    "hipertension": "Hipertensión arterial",
    "diabetes": "Diabetes",
    "sindrome_metabolico": "Síndrome metabólico",
    "obesidad": "Obesidad",
    "infeccion_gi": "Infecciones gastrointestinales",
    "post_covid": "Complicaciones post-COVID-19 (Síndrome Post Covid)",
    "acne": "Acné",
    "eccema": "Eccemas",
    "psoriasis": "Psoriasis",
    "vitiligo": "Vitiligo",
    "dermatitis": "Dermatitis",
    "renal": "Enfermedades renales crónicas o agudas",
    "gastro": "Enfermedades gastrointestinales",
    "pie_tobillo": "Lesiones y afecciones de pie y tobillo",
    "columna": "Afecciones de la columna vertebral",
    "mano_muneca": "Lesiones de mano, muñeca y antebrazo",
    "neuropsico": "Trastornos neuropsicológicos y necesidades de evaluación clínica",
    "dolor_cronico": "Dolor crónico (Terapia del Dolor)",
    "respiratorias": "Afecciones respiratorias (Neumología)",
    "intoxicaciones": "Intoxicaciones (Toxicología)",
}

SLUGS = list(ENFERMEDADES.keys())
NOMBRE_A_SLUG = {nombre: slug for slug, nombre in ENFERMEDADES.items()}
