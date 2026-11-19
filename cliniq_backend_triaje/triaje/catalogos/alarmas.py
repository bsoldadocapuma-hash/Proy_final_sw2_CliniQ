"""Señales de alarma (27).

  nivel    prioridad MÍNIMA que impone la señal:
             rojo    -> se deriva a emergencias sin consultar al modelo
             naranja -> el modelo no puede bajar de naranja
  columna  nombre de la columna binaria en el CSV
  sexo     "M" / "F" si solo aplica a un sexo

LOS NIVELES SON UNA PROPUESTA: deben ser validados por un profesional de salud.
"""
from typing import NamedTuple, Optional


class Alarma(NamedTuple):
    id: str
    columna: str
    etiqueta: str
    nivel: str
    sexo: Optional[str] = None


ALARMAS = [
    # --- Rojo: riesgo vital inmediato ---------------------------------------
    Alarma("dificultad_respirar_grave", "alarma_respirar",
           "Dificultad grave para respirar (se ahoga o no puede hablar)", "rojo"),
    Alarma("perdida_conciencia_convulsion", "alarma_conciencia",
           "Pérdida de conciencia o convulsión en este momento", "rojo"),
    Alarma("sangrado_no_para", "alarma_sangrado",
           "Sangrado abundante que no se detiene", "rojo"),
    Alarma("debilidad_un_lado_o_habla", "alarma_neurologica",
           "Debilidad de un lado del cuerpo, cara caída o dificultad para hablar", "rojo"),
    Alarma("hinchazon_cara_garganta", "alarma_hinchazon",
           "Hinchazón de cara, labios o garganta", "rojo"),
    Alarma("dolor_pecho_opresivo", "alarma_dolor_pecho_opresivo",
           "Dolor de pecho opresivo que se extiende al brazo, cuello o mandíbula", "rojo"),
    Alarma("labios_azulados", "alarma_labios_azulados",
           "Labios o piel azulados o grisáceos", "rojo"),
    Alarma("no_respira_no_responde", "alarma_no_respira_no_responde",
           "No respira o no responde", "rojo"),
    Alarma("atragantamiento", "alarma_atragantamiento",
           "Atragantamiento o algo atorado en la garganta", "rojo"),
    Alarma("reaccion_alergica_grave", "alarma_reaccion_alergica_grave",
           "Reacción alérgica grave (ronchas por todo el cuerpo con falta de aire o mareo)", "rojo"),
    Alarma("vomito_con_sangre", "alarma_vomito_con_sangre",
           "Vómito con sangre", "rojo"),
    Alarma("herida_penetrante", "alarma_herida_penetrante",
           "Herida profunda por arma blanca o de fuego", "rojo"),
    # --- Naranja: urgente ------------------------------------------------------
    Alarma("ideas_suicidas_autolesion", "alarma_ideas_suicidas_autolesion",
           "Ideas de quitarse la vida o de hacerse daño", "naranja"),
    Alarma("quemadura_extensa", "alarma_quemadura_extensa",
           "Quemadura extensa o en cara, manos o genitales", "naranja"),
    Alarma("intoxicacion_sobredosis", "alarma_intoxicacion_sobredosis",
           "Ingesta de veneno, exceso de medicamentos o sustancias tóxicas", "naranja"),
    Alarma("dolor_cabeza_subito_intenso", "alarma_dolor_cabeza_subito_intenso",
           "Dolor de cabeza repentino y muy intenso, el peor de su vida", "naranja"),
    Alarma("fiebre_rigidez_cuello", "alarma_fiebre_rigidez_cuello",
           "Fiebre con rigidez de cuello o manchas en la piel", "naranja"),
    Alarma("trauma_craneal_grave", "alarma_trauma_craneal_grave",
           "Golpe fuerte en la cabeza con vómitos, somnolencia o confusión", "naranja"),
    Alarma("heces_negras_sangre", "alarma_heces_negras_sangre",
           "Heces negras o con sangre abundante", "naranja"),
    Alarma("abdomen_rigido", "alarma_abdomen_rigido",
           "Dolor abdominal muy intenso con el abdomen duro", "naranja"),
    Alarma("embarazo_sangrado_dolor", "alarma_embarazo_sangrado_dolor",
           "Embarazada con sangrado abundante o dolor intenso", "naranja", "F"),
    Alarma("desmayo_reciente", "alarma_desmayo_reciente",
           "Desmayo reciente", "naranja"),
    Alarma("fractura_expuesta_deformidad", "alarma_fractura_expuesta_deformidad",
           "Hueso expuesto o deformidad grave de un brazo o pierna", "naranja"),
    Alarma("perdida_vision_subita", "alarma_perdida_vision_subita",
           "Pérdida repentina de la visión", "naranja"),
    Alarma("mordedura_animal_venenoso", "alarma_mordedura_animal_venenoso",
           "Mordedura de serpiente, araña o alacrán", "naranja"),
    Alarma("bebe_decaido", "alarma_bebe_decaido",
           "Bebé muy decaído, flácido o que no despierta", "naranja"),
    Alarma("deshidratacion_grave", "alarma_deshidratacion_grave",
           "Deshidratación grave (no orina, boca seca, ojos hundidos)", "naranja"),
]
