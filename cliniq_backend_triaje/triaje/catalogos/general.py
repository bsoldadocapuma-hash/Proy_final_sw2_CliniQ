"""Catálogos pequeños y fijos: edades, sexo, áreas, mensajes..."""

# Orden de gravedad: el primero es el más grave
ORDEN_PRIORIDAD = ["rojo", "naranja", "amarillo", "verde", "azul"]

# (id, etiqueta para mostrar en el frontend)
EDADES = [
    ("menor_1", "Menor de 1 año"),
    ("1_12", "1 a 12 años"),
    ("13_17", "13 a 17 años"),
    ("18_64", "18 a 64 años"),
    ("65_mas", "65 años o más"),
]
SEXOS = [("M", "Masculino"), ("F", "Femenino")]
# "no_aplica" lo completa la API sola; el frontend solo ofrece si / no
EMBARAZO = [("si", "Sí"), ("no", "No"), ("no_aplica", "No aplica")]
INICIO = [("de_golpe", "De golpe"), ("poco_a_poco", "Poco a poco")]
DURACION = [
    ("menos_1h", "Menos de 1 hora"),
    ("unas_horas", "Unas horas"),
    ("1_dia", "Aproximadamente 1 día"),
    ("varios_dias", "Varios días"),
]
EVOLUCION = [("empeora", "Empeora"), ("igual", "Igual"), ("mejora", "Mejora")]

# El embarazo no aplica a hombres ni a estas edades.
EDADES_SIN_EMBARAZO = ["menor_1", "1_12"]

# Si el paciente responde la intensidad con botones en vez de 0-10
INTENSIDAD_TEXTO = {"leve": 2, "moderado": 5, "muy_fuerte": 8}

# Cuántos motivos de consulta puede marcar el paciente a la vez
MAX_MOTIVOS = 5

# Opción "ninguna" de las listas de casillas (alarmas / enfermedades)
VALOR_NINGUNA = "ninguna"

# Áreas a las que puede derivar el sistema
AREAS = [
    "emergencias", "medicina_general", "pediatria", "cardiologia", "neumologia",
    "neurologia", "gastroenterologia", "traumatologia", "cirugia", "urologia",
    "ginecologia", "dermatologia", "oftalmologia", "otorrinolaringologia",
    "odontologia", "salud_mental",
]

# Mensajes para el paciente (plantillas, NO los genera el modelo).
# Deben ser revisados por un profesional de salud.
MENSAJES = {
    "rojo": "Vaya a emergencias o llame a una ambulancia ahora.",
    "naranja": "Su caso requiere atención prioritaria. Acuda a un centro de salud lo antes posible.",
    "amarillo": "Su caso requiere atención médica pronto. Acuda a un centro de salud.",
    "verde": "Su caso no parece urgente. Puede ser atendido en consulta.",
    "azul": "Su caso es de baja urgencia. Puede ser atendido en consulta programada.",
}

AVISO = ("Resultado orientativo de apoyo logístico. No es un diagnóstico médico. "
         "Si los síntomas empeoran o siente que es grave, acuda de inmediato "
         "a emergencias.")
