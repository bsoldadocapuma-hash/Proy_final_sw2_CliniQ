/**
 * Catálogos del formulario de triaje.
 * Generado a partir de triaje/catalogos (API Flask). Los `id` son los valores que
 * espera la API; las `etiqueta` son lo que ve el paciente.
 * Si cambias un catálogo en Python, actualiza este archivo (o pídelo a
 * GET /api/v1/catalogos).
 */
export interface OpcionCatalogo {
  id: string;
  etiqueta: string;
  grupo?: string;
  /** Si está, la opción solo aplica a ese sexo. */
  sexo?: "M" | "F";
}

/** Máximo de motivos de consulta que acepta la API (MAX_MOTIVOS en Python). */
export const MAX_MOTIVOS = 5;

/** 50 motivos de consulta (el paciente puede marcar de 1 a MAX_MOTIVOS). */
export const MOTIVOS: OpcionCatalogo[] = [
  {"id": "dolor_pecho", "etiqueta": "Dolor de pecho", "grupo": "Corazón y respiración"},
  {"id": "dificultad_respirar", "etiqueta": "Dificultad para respirar", "grupo": "Corazón y respiración"},
  {"id": "palpitaciones", "etiqueta": "Palpitaciones o latidos irregulares", "grupo": "Corazón y respiración"},
  {"id": "hinchazon_piernas", "etiqueta": "Hinchazón de piernas o pies", "grupo": "Corazón y respiración"},
  {"id": "tos_persistente", "etiqueta": "Tos persistente o con flemas", "grupo": "Corazón y respiración"},
  {"id": "tos_garganta", "etiqueta": "Tos o dolor de garganta", "grupo": "Corazón y respiración"},
  {"id": "resfriado_congestion", "etiqueta": "Resfriado, gripe o congestión nasal", "grupo": "Corazón y respiración"},
  {"id": "fiebre", "etiqueta": "Fiebre", "grupo": "Malestar general"},
  {"id": "fatiga_insomnio", "etiqueta": "Cansancio extremo o insomnio", "grupo": "Malestar general"},
  {"id": "perdida_peso_apetito", "etiqueta": "Pérdida de peso o de apetito", "grupo": "Malestar general"},
  {"id": "presion_azucar_alta", "etiqueta": "Presión o azúcar descontrolada", "grupo": "Malestar general"},
  {"id": "control_certificado", "etiqueta": "Control de rutina o certificado médico", "grupo": "Malestar general"},
  {"id": "otro", "etiqueta": "Otro motivo", "grupo": "Malestar general"},
  {"id": "dolor_abdominal", "etiqueta": "Dolor abdominal", "grupo": "Digestivo"},
  {"id": "vomitos_diarrea", "etiqueta": "Vómitos o diarrea", "grupo": "Digestivo"},
  {"id": "estrenimiento", "etiqueta": "Estreñimiento", "grupo": "Digestivo"},
  {"id": "acidez_reflujo", "etiqueta": "Acidez o reflujo", "grupo": "Digestivo"},
  {"id": "ictericia", "etiqueta": "Piel u ojos amarillos", "grupo": "Digestivo"},
  {"id": "dolor_cabeza", "etiqueta": "Dolor de cabeza", "grupo": "Cabeza y sistema nervioso"},
  {"id": "mareo_desmayo", "etiqueta": "Mareo o desmayo", "grupo": "Cabeza y sistema nervioso"},
  {"id": "convulsion", "etiqueta": "Convulsión", "grupo": "Cabeza y sistema nervioso"},
  {"id": "hormigueo_entumecimiento", "etiqueta": "Hormigueo o adormecimiento", "grupo": "Cabeza y sistema nervioso"},
  {"id": "golpe_caida", "etiqueta": "Golpe o caída", "grupo": "Huesos, músculos y heridas"},
  {"id": "fractura_torcedura", "etiqueta": "Posible fractura o torcedura", "grupo": "Huesos, músculos y heridas"},
  {"id": "dolor_espalda", "etiqueta": "Dolor de espalda", "grupo": "Huesos, músculos y heridas"},
  {"id": "dolor_cuello", "etiqueta": "Dolor de cuello", "grupo": "Huesos, músculos y heridas"},
  {"id": "dolor_articular_muscular", "etiqueta": "Dolor de articulaciones o músculos", "grupo": "Huesos, músculos y heridas"},
  {"id": "herida_sangrado", "etiqueta": "Herida o sangrado", "grupo": "Huesos, músculos y heridas"},
  {"id": "herida_infectada", "etiqueta": "Herida infectada o absceso", "grupo": "Huesos, músculos y heridas"},
  {"id": "quemadura", "etiqueta": "Quemadura", "grupo": "Huesos, músculos y heridas"},
  {"id": "mordedura_picadura", "etiqueta": "Mordedura o picadura", "grupo": "Huesos, músculos y heridas"},
  {"id": "intoxicacion_envenenamiento", "etiqueta": "Intoxicación o envenenamiento", "grupo": "Huesos, músculos y heridas"},
  {"id": "ardor_urinario", "etiqueta": "Ardor o dolor al orinar", "grupo": "Urinario y genital"},
  {"id": "sangre_orina", "etiqueta": "Sangre en la orina", "grupo": "Urinario y genital"},
  {"id": "colico_renal", "etiqueta": "Dolor de riñón o cólico renal", "grupo": "Urinario y genital"},
  {"id": "dolor_testicular", "etiqueta": "Dolor o hinchazón testicular", "grupo": "Urinario y genital", "sexo": "M"},
  {"id": "infeccion_genital", "etiqueta": "Flujo, secreción o infección genital", "grupo": "Urinario y genital"},
  {"id": "sangrado_vaginal", "etiqueta": "Sangrado vaginal", "grupo": "Ginecología y embarazo", "sexo": "F"},
  {"id": "dolor_pelvico_menstrual", "etiqueta": "Dolor pélvico o menstrual", "grupo": "Ginecología y embarazo", "sexo": "F"},
  {"id": "molestia_embarazo", "etiqueta": "Molestia durante el embarazo", "grupo": "Ginecología y embarazo", "sexo": "F"},
  {"id": "erupcion_piel", "etiqueta": "Erupción, manchas o granos en la piel", "grupo": "Piel"},
  {"id": "picazon_alergia", "etiqueta": "Picazón o reacción alérgica", "grupo": "Piel"},
  {"id": "problema_ojo", "etiqueta": "Dolor, enrojecimiento o lesión del ojo", "grupo": "Ojos, oídos, nariz y boca"},
  {"id": "vision_borrosa", "etiqueta": "Visión borrosa", "grupo": "Ojos, oídos, nariz y boca"},
  {"id": "dolor_oido", "etiqueta": "Dolor de oído", "grupo": "Ojos, oídos, nariz y boca"},
  {"id": "sangrado_nariz", "etiqueta": "Sangrado de nariz", "grupo": "Ojos, oídos, nariz y boca"},
  {"id": "dolor_dental", "etiqueta": "Dolor de muela o dientes", "grupo": "Ojos, oídos, nariz y boca"},
  {"id": "ansiedad_panico", "etiqueta": "Ansiedad o crisis de pánico", "grupo": "Salud mental"},
  {"id": "tristeza_depresion", "etiqueta": "Tristeza profunda o depresión", "grupo": "Salud mental"},
  {"id": "problema_bebe_nino", "etiqueta": "Bebé o niño con llanto, decaimiento o rechazo del alimento", "grupo": "Niños"},
];

/** 27 señales de alarma (ninguna marcada = sin alarmas). */
export const ALARMAS: OpcionCatalogo[] = [
  {"id": "dificultad_respirar_grave", "etiqueta": "Dificultad grave para respirar (se ahoga o no puede hablar)"},
  {"id": "perdida_conciencia_convulsion", "etiqueta": "Pérdida de conciencia o convulsión en este momento"},
  {"id": "sangrado_no_para", "etiqueta": "Sangrado abundante que no se detiene"},
  {"id": "debilidad_un_lado_o_habla", "etiqueta": "Debilidad de un lado del cuerpo, cara caída o dificultad para hablar"},
  {"id": "hinchazon_cara_garganta", "etiqueta": "Hinchazón de cara, labios o garganta"},
  {"id": "dolor_pecho_opresivo", "etiqueta": "Dolor de pecho opresivo que se extiende al brazo, cuello o mandíbula"},
  {"id": "labios_azulados", "etiqueta": "Labios o piel azulados o grisáceos"},
  {"id": "no_respira_no_responde", "etiqueta": "No respira o no responde"},
  {"id": "atragantamiento", "etiqueta": "Atragantamiento o algo atorado en la garganta"},
  {"id": "reaccion_alergica_grave", "etiqueta": "Reacción alérgica grave (ronchas por todo el cuerpo con falta de aire o mareo)"},
  {"id": "vomito_con_sangre", "etiqueta": "Vómito con sangre"},
  {"id": "herida_penetrante", "etiqueta": "Herida profunda por arma blanca o de fuego"},
  {"id": "ideas_suicidas_autolesion", "etiqueta": "Ideas de quitarse la vida o de hacerse daño"},
  {"id": "quemadura_extensa", "etiqueta": "Quemadura extensa o en cara, manos o genitales"},
  {"id": "intoxicacion_sobredosis", "etiqueta": "Ingesta de veneno, exceso de medicamentos o sustancias tóxicas"},
  {"id": "dolor_cabeza_subito_intenso", "etiqueta": "Dolor de cabeza repentino y muy intenso, el peor de su vida"},
  {"id": "fiebre_rigidez_cuello", "etiqueta": "Fiebre con rigidez de cuello o manchas en la piel"},
  {"id": "trauma_craneal_grave", "etiqueta": "Golpe fuerte en la cabeza con vómitos, somnolencia o confusión"},
  {"id": "heces_negras_sangre", "etiqueta": "Heces negras o con sangre abundante"},
  {"id": "abdomen_rigido", "etiqueta": "Dolor abdominal muy intenso con el abdomen duro"},
  {"id": "embarazo_sangrado_dolor", "etiqueta": "Embarazada con sangrado abundante o dolor intenso", "sexo": "F"},
  {"id": "desmayo_reciente", "etiqueta": "Desmayo reciente"},
  {"id": "fractura_expuesta_deformidad", "etiqueta": "Hueso expuesto o deformidad grave de un brazo o pierna"},
  {"id": "perdida_vision_subita", "etiqueta": "Pérdida repentina de la visión"},
  {"id": "mordedura_animal_venenoso", "etiqueta": "Mordedura de serpiente, araña o alacrán"},
  {"id": "bebe_decaido", "etiqueta": "Bebé muy decaído, flácido o que no despierta"},
  {"id": "deshidratacion_grave", "etiqueta": "Deshidratación grave (no orina, boca seca, ojos hundidos)"},
];

/** 24 enfermedades o condiciones previas (ninguna marcada = sin antecedentes). */
export const ENFERMEDADES: OpcionCatalogo[] = [
  {"id": "diabetes", "etiqueta": "Diabetes"},
  {"id": "hipertension", "etiqueta": "Hipertensión (presión alta)"},
  {"id": "corazon", "etiqueta": "Enfermedad del corazón (infarto previo, insuficiencia cardíaca, arritmia)"},
  {"id": "asma_epoc", "etiqueta": "Asma o EPOC"},
  {"id": "anticoagulantes", "etiqueta": "Toma anticoagulantes (\"adelgazantes de la sangre\")"},
  {"id": "insuficiencia_renal", "etiqueta": "Enfermedad renal o diálisis"},
  {"id": "enfermedad_hepatica", "etiqueta": "Enfermedad del hígado (cirrosis, hepatitis)"},
  {"id": "cancer", "etiqueta": "Cáncer (actual o en tratamiento)"},
  {"id": "inmunosupresion", "etiqueta": "Defensas bajas (VIH, trasplante, quimioterapia, corticoides)"},
  {"id": "epilepsia", "etiqueta": "Epilepsia"},
  {"id": "acv_previo", "etiqueta": "Derrame o ACV previo"},
  {"id": "obesidad", "etiqueta": "Obesidad"},
  {"id": "tuberculosis", "etiqueta": "Tuberculosis (actual o en tratamiento)"},
  {"id": "chagas", "etiqueta": "Enfermedad de Chagas"},
  {"id": "tiroides", "etiqueta": "Enfermedad de la tiroides"},
  {"id": "anemia", "etiqueta": "Anemia"},
  {"id": "gastritis_ulcera", "etiqueta": "Gastritis o úlcera"},
  {"id": "artritis", "etiqueta": "Artritis o artrosis"},
  {"id": "salud_mental", "etiqueta": "Depresión, ansiedad u otro trastorno mental"},
  {"id": "alergia_medicamentos", "etiqueta": "Alergia a medicamentos"},
  {"id": "tabaquismo", "etiqueta": "Fuma"},
  {"id": "alcohol_drogas", "etiqueta": "Consumo problemático de alcohol o drogas"},
  {"id": "colesterol_alto", "etiqueta": "Colesterol o triglicéridos altos"},
  {"id": "trastorno_coagulacion", "etiqueta": "Trastorno de la coagulación (hemofilia u otro)"},
];

export const SEXOS = [{"id": "M", "etiqueta": "Masculino"}, {"id": "F", "etiqueta": "Femenino"}] as const;

export const OPCIONES_INICIO = [{"id": "de_golpe", "etiqueta": "De golpe"}, {"id": "poco_a_poco", "etiqueta": "Poco a poco"}];
export const OPCIONES_DURACION = [{"id": "menos_1h", "etiqueta": "Menos de 1 hora"}, {"id": "unas_horas", "etiqueta": "Unas horas"}, {"id": "1_dia", "etiqueta": "Aproximadamente 1 día"}, {"id": "varios_dias", "etiqueta": "Varios días"}];
export const OPCIONES_EVOLUCION = [{"id": "empeora", "etiqueta": "Empeora"}, {"id": "igual", "etiqueta": "Igual"}, {"id": "mejora", "etiqueta": "Mejora"}];

/** Nombre legible de cada área de derivación. */
export const AREAS_ETIQUETA: Record<string, string> = {
  "emergencias": "Emergencias",
  "medicina_general": "Medicina general",
  "pediatria": "Pediatría",
  "cardiologia": "Cardiología",
  "neumologia": "Neumología",
  "neurologia": "Neurología",
  "gastroenterologia": "Gastroenterología",
  "traumatologia": "Traumatología",
  "cirugia": "Cirugía",
  "urologia": "Urología",
  "ginecologia": "Ginecología",
  "dermatologia": "Dermatología",
  "oftalmologia": "Oftalmología",
  "otorrinolaringologia": "Otorrinolaringología",
  "odontologia": "Odontología",
  "salud_mental": "Salud mental"
};