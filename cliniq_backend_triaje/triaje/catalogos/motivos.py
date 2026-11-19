"""Motivos de consulta (50).

Para agregar uno: añade una línea aquí, vuelve a generar/ampliar el dataset y
ejecuta `python manage.py entrenar`.

  id        identificador que envía el frontend y que usa el CSV
  etiqueta  texto para el paciente
  grupo     para agrupar en el frontend
  area      área de derivación habitual (la usa el generador de datos)
  base      prioridad típica: naranja | amarillo | verde | azul
  sexo      "M" / "F" si solo aplica a un sexo (None = ambos)
"""
from typing import NamedTuple, Optional


class Motivo(NamedTuple):
    id: str
    etiqueta: str
    grupo: str
    area: str
    base: str
    sexo: Optional[str] = None


MOTIVOS = [
    # --- Corazón y respiración -------------------------------------------
    Motivo("dolor_pecho", "Dolor de pecho", "Corazón y respiración", "cardiologia", "naranja"),
    Motivo("dificultad_respirar", "Dificultad para respirar", "Corazón y respiración", "neumologia", "naranja"),
    Motivo("palpitaciones", "Palpitaciones o latidos irregulares", "Corazón y respiración", "cardiologia", "amarillo"),
    Motivo("hinchazon_piernas", "Hinchazón de piernas o pies", "Corazón y respiración", "medicina_general", "amarillo"),
    Motivo("tos_persistente", "Tos persistente o con flemas", "Corazón y respiración", "neumologia", "verde"),
    Motivo("tos_garganta", "Tos o dolor de garganta", "Corazón y respiración", "medicina_general", "verde"),
    Motivo("resfriado_congestion", "Resfriado, gripe o congestión nasal", "Corazón y respiración", "medicina_general", "azul"),
    # --- Malestar general ------------------------------------------------
    Motivo("fiebre", "Fiebre", "Malestar general", "medicina_general", "amarillo"),
    Motivo("fatiga_insomnio", "Cansancio extremo o insomnio", "Malestar general", "medicina_general", "azul"),
    Motivo("perdida_peso_apetito", "Pérdida de peso o de apetito", "Malestar general", "medicina_general", "verde"),
    Motivo("presion_azucar_alta", "Presión o azúcar descontrolada", "Malestar general", "medicina_general", "amarillo"),
    Motivo("control_certificado", "Control de rutina o certificado médico", "Malestar general", "medicina_general", "azul"),
    Motivo("otro", "Otro motivo", "Malestar general", "medicina_general", "verde"),
    # --- Digestivo -------------------------------------------------------
    Motivo("dolor_abdominal", "Dolor abdominal", "Digestivo", "gastroenterologia", "amarillo"),
    Motivo("vomitos_diarrea", "Vómitos o diarrea", "Digestivo", "gastroenterologia", "amarillo"),
    Motivo("estrenimiento", "Estreñimiento", "Digestivo", "gastroenterologia", "azul"),
    Motivo("acidez_reflujo", "Acidez o reflujo", "Digestivo", "gastroenterologia", "verde"),
    Motivo("ictericia", "Piel u ojos amarillos", "Digestivo", "gastroenterologia", "amarillo"),
    # --- Cabeza y sistema nervioso ----------------------------------------
    Motivo("dolor_cabeza", "Dolor de cabeza", "Cabeza y sistema nervioso", "medicina_general", "verde"),
    Motivo("mareo_desmayo", "Mareo o desmayo", "Cabeza y sistema nervioso", "neurologia", "amarillo"),
    Motivo("convulsion", "Convulsión", "Cabeza y sistema nervioso", "neurologia", "naranja"),
    Motivo("hormigueo_entumecimiento", "Hormigueo o adormecimiento", "Cabeza y sistema nervioso", "neurologia", "amarillo"),
    # --- Huesos, músculos, heridas ----------------------------------------
    Motivo("golpe_caida", "Golpe o caída", "Huesos, músculos y heridas", "traumatologia", "amarillo"),
    Motivo("fractura_torcedura", "Posible fractura o torcedura", "Huesos, músculos y heridas", "traumatologia", "amarillo"),
    Motivo("dolor_espalda", "Dolor de espalda", "Huesos, músculos y heridas", "traumatologia", "verde"),
    Motivo("dolor_cuello", "Dolor de cuello", "Huesos, músculos y heridas", "traumatologia", "verde"),
    Motivo("dolor_articular_muscular", "Dolor de articulaciones o músculos", "Huesos, músculos y heridas", "traumatologia", "verde"),
    Motivo("herida_sangrado", "Herida o sangrado", "Huesos, músculos y heridas", "cirugia", "amarillo"),
    Motivo("herida_infectada", "Herida infectada o absceso", "Huesos, músculos y heridas", "cirugia", "amarillo"),
    Motivo("quemadura", "Quemadura", "Huesos, músculos y heridas", "cirugia", "amarillo"),
    Motivo("mordedura_picadura", "Mordedura o picadura", "Huesos, músculos y heridas", "medicina_general", "amarillo"),
    Motivo("intoxicacion_envenenamiento", "Intoxicación o envenenamiento", "Huesos, músculos y heridas", "emergencias", "naranja"),
    # --- Urinario y genital -------------------------------------------------
    Motivo("ardor_urinario", "Ardor o dolor al orinar", "Urinario y genital", "urologia", "verde"),
    Motivo("sangre_orina", "Sangre en la orina", "Urinario y genital", "urologia", "amarillo"),
    Motivo("colico_renal", "Dolor de riñón o cólico renal", "Urinario y genital", "urologia", "amarillo"),
    Motivo("dolor_testicular", "Dolor o hinchazón testicular", "Urinario y genital", "urologia", "amarillo", "M"),
    Motivo("infeccion_genital", "Flujo, secreción o infección genital", "Urinario y genital", "medicina_general", "verde"),
    # --- Ginecología y embarazo ---------------------------------------------
    Motivo("sangrado_vaginal", "Sangrado vaginal", "Ginecología y embarazo", "ginecologia", "amarillo", "F"),
    Motivo("dolor_pelvico_menstrual", "Dolor pélvico o menstrual", "Ginecología y embarazo", "ginecologia", "verde", "F"),
    Motivo("molestia_embarazo", "Molestia durante el embarazo", "Ginecología y embarazo", "ginecologia", "amarillo", "F"),
    # --- Piel ----------------------------------------------------------------
    Motivo("erupcion_piel", "Erupción, manchas o granos en la piel", "Piel", "dermatologia", "verde"),
    Motivo("picazon_alergia", "Picazón o reacción alérgica", "Piel", "dermatologia", "verde"),
    # --- Ojos, oídos, nariz y boca ---------------------------------------------
    Motivo("problema_ojo", "Dolor, enrojecimiento o lesión del ojo", "Ojos, oídos, nariz y boca", "oftalmologia", "amarillo"),
    Motivo("vision_borrosa", "Visión borrosa", "Ojos, oídos, nariz y boca", "oftalmologia", "amarillo"),
    Motivo("dolor_oido", "Dolor de oído", "Ojos, oídos, nariz y boca", "otorrinolaringologia", "verde"),
    Motivo("sangrado_nariz", "Sangrado de nariz", "Ojos, oídos, nariz y boca", "otorrinolaringologia", "verde"),
    Motivo("dolor_dental", "Dolor de muela o dientes", "Ojos, oídos, nariz y boca", "odontologia", "verde"),
    # --- Salud mental ------------------------------------------------------------
    Motivo("ansiedad_panico", "Ansiedad o crisis de pánico", "Salud mental", "salud_mental", "amarillo"),
    Motivo("tristeza_depresion", "Tristeza profunda o depresión", "Salud mental", "salud_mental", "verde"),
    # --- Niños ---------------------------------------------------------------------
    Motivo("problema_bebe_nino", "Bebé o niño con llanto, decaimiento o rechazo del alimento",
           "Niños", "pediatria", "amarillo"),
]
