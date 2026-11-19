"""Generador de un dataset SINTÉTICO de triaje.

⚠ Las etiquetas salen de una fórmula inventada (motivos + intensidad + edad +
enfermedades + reglas de seguridad), NO de casos reales ni de criterio clínico.
Sirve para probar el sistema de punta a punta. Para un modelo de verdad, reemplaza
data/dataset_triaje.csv por casos reales etiquetados por un profesional de salud
(mismas columnas).
"""
from __future__ import annotations

import math
import random
from pathlib import Path

import pandas as pd

from triaje import catalogos as cat
from triaje.dominio.prioridad import gravedad
from triaje.dominio.reglas import prioridad_minima_por_reglas

# Motivos más frecuentes pesan más al muestrear (el resto pesa 1)
COMUNES = {
    "fiebre": 4, "dolor_abdominal": 4, "dolor_cabeza": 4, "tos_garganta": 4,
    "vomitos_diarrea": 3, "resfriado_congestion": 3, "golpe_caida": 3,
    "dolor_pecho": 3, "dificultad_respirar": 3, "herida_sangrado": 2,
    "dolor_espalda": 2, "dolor_articular_muscular": 2, "ardor_urinario": 2,
    "erupcion_piel": 2, "mareo_desmayo": 2, "problema_bebe_nino": 2,
}
SOLO_13_MAS = {"sangrado_vaginal", "dolor_pelvico_menstrual", "molestia_embarazo",
               "infeccion_genital"}
SOLO_ADULTOS = {"presion_azucar_alta", "molestia_embarazo"}
INFECCIOSOS = {"fiebre", "resfriado_congestion", "tos_garganta", "vomitos_diarrea",
               "dolor_oido", "herida_infectada", "problema_bebe_nino",
               "tos_persistente", "ardor_urinario"}
PEDIATRIA = {"medicina_general", "gastroenterologia", "neumologia",
             "otorrinolaringologia", "dermatologia", "neurologia"}
EMBARAZO_GINECO = {"dolor_abdominal", "vomitos_diarrea", "sangrado_vaginal",
                   "dolor_pelvico_menstrual", "molestia_embarazo"}
PREVALENCIA = {"diabetes": .08, "hipertension": .15, "corazon": .06, "asma_epoc": .07,
               "anticoagulantes": .03, "obesidad": .08, "colesterol_alto": .08,
               "tabaquismo": .10, "artritis": .06, "gastritis_ulcera": .07}
ENFERMEDADES_INFANTILES = {"asma_epoc": .05, "epilepsia": .02, "alergia_medicamentos": .03,
                           "anemia": .04}
NIVEL = {"naranja": 1, "amarillo": 2, "verde": 3, "azul": 4}   # índice en ORDEN_PRIORIDAD
# Calibra el reparto de colores (ver el resumen que imprime `manage.py generar`)
AJUSTE_GENERAL = 1.2
# Cada motivo extra agrava un poco el caso
PENALIZACION_POR_MOTIVO_EXTRA = 0.2
# Cuántos motivos extra suma un paciente (0, 1 o 2) y con qué frecuencia
PESOS_MOTIVOS_EXTRA = [60, 28, 12]


def _edad(rng, motivo) -> str:
    edades = list(cat.VALORES["edad"])
    pesos = [4, 12, 8, 56, 20]
    if motivo.id == "problema_bebe_nino":
        pesos = [1, 2, 0, 0, 0]
    elif motivo.id in SOLO_ADULTOS:
        pesos = [0, 0, 0, 56, 20]
    elif motivo.id in SOLO_13_MAS:
        pesos = [0, 0, 8, 56, 20]
    return rng.choices(edades, weights=pesos)[0]


def _compatible(m, sexo: str, edad: str, embarazo: str) -> bool:
    """¿Puede un paciente con estos datos marcar también el motivo m?"""
    if m.sexo and m.sexo != sexo:
        return False
    if m.id in SOLO_ADULTOS and edad not in ("18_64", "65_mas"):
        return False
    if m.id in SOLO_13_MAS and edad in ("menor_1", "1_12"):
        return False
    if m.id == "problema_bebe_nino" and edad not in ("menor_1", "1_12"):
        return False
    if m.id == "molestia_embarazo" and embarazo != "si":
        return False
    return True


def _elegir_motivos(rng, principal, sexo, edad, embarazo) -> list:
    motivos = [principal]
    extra = rng.choices([0, 1, 2], weights=PESOS_MOTIVOS_EXTRA)[0]
    for _ in range(extra):
        candidatos = [m for m in cat.MOTIVOS
                      if m not in motivos and _compatible(m, sexo, edad, embarazo)]
        motivos.append(rng.choices(candidatos,
                                   weights=[COMUNES.get(m.id, 1) for m in candidatos])[0])
    return motivos


def _fila(rng: random.Random) -> dict:
    principal = rng.choices(cat.MOTIVOS, weights=[COMUNES.get(m.id, 1) for m in cat.MOTIVOS])[0]
    sexo = principal.sexo or rng.choice(["M", "F"])
    edad = _edad(rng, principal)

    if sexo == "M" or edad in cat.EDADES_SIN_EMBARAZO:
        embarazo = "no_aplica"
    elif principal.id == "molestia_embarazo":
        embarazo = "si"
    elif edad == "65_mas":
        embarazo = "no"
    else:
        embarazo = "si" if rng.random() < (0.10 if edad == "18_64" else 0.02) else "no"

    motivos = _elegir_motivos(rng, principal, sexo, edad, embarazo)
    ids = {m.id for m in motivos}
    # El motivo más grave (a igual gravedad, el primero del catálogo) define base y área
    peor = min(motivos, key=lambda m: (NIVEL[m.base], cat.MOTIVOS.index(m)))

    # Señales de alarma (~9 % de los casos tiene alguna)
    alarmas = set()
    if rng.random() < 0.09:
        posibles = [a.id for a in cat.ALARMAS if not a.sexo or a.sexo == sexo]
        alarmas.add(rng.choice(posibles))
        if rng.random() < 0.2:
            alarmas.add(rng.choice(posibles))

    # Enfermedades previas
    enfermedades = set()
    for e in cat.ENFERMEDADES:
        if edad in ("menor_1", "1_12"):
            p = ENFERMEDADES_INFANTILES.get(e.id, 0)
        else:
            p = PREVALENCIA.get(e.id, 0.03) * {"13_17": 0.3, "18_64": 1, "65_mas": 3}[edad]
        if rng.random() < p:
            enfermedades.add(e.id)

    base = NIVEL[peor.base]
    intensidad = int(min(10, max(0, round(rng.gauss(8.5 - 1.8 * base, 2)))))
    inicio = "de_golpe" if rng.random() < (0.35 if base <= 2 else 0.2) else "poco_a_poco"
    duracion = rng.choices(cat.VALORES["duracion"], weights=[2, 4, 3, 3])[0]
    evolucion = rng.choices(cat.VALORES["evolucion"], weights=[3, 4, 3])[0]

    # Temperatura (opcional)
    infeccioso = bool(ids & INFECCIOSOS)
    informa = rng.random() < (0.9 if infeccioso else 0.12)
    if informa:
        if ids & {"fiebre", "problema_bebe_nino"}:
            t = rng.gauss(38.9, 0.8)
        elif infeccioso:
            t = rng.gauss(37.8, 0.9)
        else:
            t = rng.gauss(36.7, 0.4)
        temperatura = round(min(41.5, max(35.0, t)), 1)
    else:
        temperatura = math.nan

    fila = {"edad": edad, "sexo": sexo, "embarazo": embarazo, "inicio": inicio,
            "duracion": duracion, "evolucion": evolucion,
            "intensidad": intensidad, "temperatura": temperatura}
    for id_, col in cat.COLUMNA_MOTIVO.items():
        fila[col] = int(id_ in ids)
    for id_, col in cat.COLUMNA_ALARMA.items():
        fila[col] = int(id_ in alarmas)
    for id_, col in cat.COLUMNA_ENFERMEDAD.items():
        fila[col] = int(id_ in enfermedades)

    # ---- Prioridad: fórmula inventada (1 = naranja ... 4 = azul) ---------------
    g = float(base) + AJUSTE_GENERAL
    g -= PENALIZACION_POR_MOTIVO_EXTRA * (len(motivos) - 1)
    g += -0.8 if intensidad >= 8 else (-0.3 if intensidad >= 6 else (0.5 if intensidad <= 2 else 0))
    g += -0.4 if inicio == "de_golpe" else 0
    g += {"empeora": -0.5, "igual": 0.0, "mejora": 0.5}[evolucion]
    g += -0.3 if (duracion == "varios_dias" and evolucion == "empeora") else 0
    g += {"menor_1": -1.0, "1_12": -0.3, "13_17": 0, "18_64": 0, "65_mas": -0.5}[edad]
    if not math.isnan(temperatura):
        g += -0.5 if temperatura >= 39.5 else (-0.2 if temperatura >= 38.5 else 0)
    riesgo = sum(1 for e in cat.ENFERMEDADES if e.riesgo and e.id in enfermedades)
    g -= min(0.9, 0.3 * riesgo)
    g -= 0.4 if embarazo == "si" else 0
    g += rng.gauss(0, 0.35)
    prioridad = cat.ORDEN_PRIORIDAD[min(4, max(1, round(g)))]

    # Las reglas de seguridad nunca se contradicen
    minimo, _ = prioridad_minima_por_reglas(fila)
    if minimo and gravedad(minimo) < gravedad(prioridad):
        prioridad = minimo

    # ---- Área de derivación (la del motivo más grave) ---------------------------
    area = peor.area
    if edad in ("menor_1", "1_12") and area in PEDIATRIA:
        area = "pediatria"
    if embarazo == "si" and ids & EMBARAZO_GINECO:
        area = "ginecologia"
    if prioridad == "rojo":
        area = "emergencias"
    elif rng.random() < 0.03:
        area = "medicina_general"      # ruido, como en datos reales

    fila[cat.OBJETIVO_PRIORIDAD] = prioridad
    fila[cat.OBJETIVO_AREA] = area
    return fila


def generar_dataframe(filas: int = 4000, semilla: int = 42) -> pd.DataFrame:
    rng = random.Random(semilla)
    datos = [_fila(rng) for _ in range(filas)]
    return pd.DataFrame(datos, columns=cat.FEATURES + cat.OBJETIVOS)


def generar(filas: int, semilla: int, salida: Path) -> None:
    df = generar_dataframe(filas, semilla)
    salida = Path(salida)
    salida.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(salida, index=False)             # temperatura vacía = NaN -> celda vacía
    n = df[list(cat.COLUMNA_MOTIVO.values())].sum(axis=1)
    print(f"Dataset SINTÉTICO guardado en {salida} ({len(df)} filas).")
    print(df[cat.OBJETIVO_PRIORIDAD].value_counts().reindex(cat.ORDEN_PRIORIDAD).to_string())
    print(f"\nMotivos por caso: 1 -> {(n == 1).mean():.0%}, 2 -> {(n == 2).mean():.0%}, "
          f"3 -> {(n == 3).mean():.0%}")
    print("Recuerda: son datos inventados, solo para probar el sistema.")
