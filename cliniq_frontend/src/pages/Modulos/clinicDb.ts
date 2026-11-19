// clinicDb.ts
// "Base de datos" de prueba en localStorage, con las entidades de tu diagrama de clases
// (Usuario, Especialidad, Horario, Cita, Diagnostico, Receta, Detalle_Receta, Alerta_Riesgo).
// Cuando tengas la API, reemplaza el cuerpo de cada función por su fetch (se indica cuál).
import { useEffect, useState } from "react";

/* ───────────── Tipos (nombres de campos = columnas de tu BD) ───────────── */
export type Rol = "P" | "M" | "C"; // Usuario.rol: Paciente / Médico / Coordinador
export type Modalidad = "Virtual" | "Presencial";
export type Prioridad = "Alta" | "Media" | "Baja";
export type EstadoCita = "Solicitada" | "Confirmada" | "En curso" | "Atendida" | "Cancelada" | "Rechazada";

export interface Usuario {
  id: number; ci: number; email: string; nombre: string; telefono: number;
  rol: Rol; especialidad_id?: number; estado_disponibilidad: boolean;
  blockchain_pub_key?: string;  // clave pública ECDSA del médico (se genera al firmar por primera vez)
}
export interface Especialidad { id: number; nombre: string }
export interface Horario { id: number; medico_id: number; dia: string; hora_inicio: string; hora_fin: string; tipo_turno: string }
export interface Cita {
  id: number;
  paciente_id: number;          // relación "Solicita"
  medico_id: number | null;     // relación "Atiende" (null mientras esté Solicitada)
  especialidad_id: number;      // AÑADIDO: el paciente pide una especialidad antes de tener médico
  fecha: string;                // YYYY-MM-DD
  hora_inicio: string;          // "" mientras esté Solicitada
  hora_fin: string;
  estado: EstadoCita;
  modalidad: Modalidad;
  link_google_meet: string;
  descripcion_progreso: string;
  motivo: string;
  descripcion_triaje: string;
  prioridad: Prioridad;
}
export interface Diagnostico { id: number; cita_id: number; descripcion: string; indicacion: string }
export interface Receta { id: number; cita_id: number; fecha: string; hora: string; estado_envio_email: boolean; pdf_generado_url: string }
export interface DetalleReceta { id: number; receta_id: number; medicamento_id?: number; medicamento: string; dosis: string; frecuencia: string; duracion: string; via_administracion: string }
export interface AlertaRiesgo {
  id: number; paciente_id: number; fecha: string; hora: string;
  diagnostico_principal: string; nivel_riesgo: "Alto" | "Medio" | "Bajo"; patrones_detectados: string;
  probabilidad_maxima?: number;                       // 0..1
  matriz_probabilidades?: Record<string, number>;     // categoría → probabilidad (0..1)
  revisada?: boolean;                                 // AÑADIDO: el médico ya la revisó
}
export interface Alergia { id: number; nombre: string }
export interface AlergiaUsuario { usuario_id: number; alergia_id: number }
export interface Medicamento { id: number; nombre: string; forma_farmaceutica: string; concentracion: string }
export interface Sintoma { id: number; nombre: string }
export interface CitaSintoma { cita_id: number; sintoma_id: number; severidad: string; observacion: string; descripcion: string }
export interface EvidenciaBlockchain {
  id: number; cita_id: number; hash_documento: string; tx_hash_red: string;
  fecha: string; hora: string; medico_pub_key: string;
  firma: string;                // AÑADIDO: firma ECDSA del hash (permite verificar sin la clave privada)
}
export interface DB {
  usuarios: Usuario[]; especialidades: Especialidad[]; horarios: Horario[]; citas: Cita[];
  diagnosticos: Diagnostico[]; recetas: Receta[]; detalles_receta: DetalleReceta[]; alertas: AlertaRiesgo[];
  alergias: Alergia[]; alergias_usuario: AlergiaUsuario[]; medicamentos: Medicamento[];
  sintomas: Sintoma[]; cita_sintomas: CitaSintoma[]; evidencias: EvidenciaBlockchain[];
}

/* ───────────── Utilidades de fecha/hora ───────────── */
const pad = (n: number) => String(n).padStart(2, "0");
export const aISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hoy = () => aISO(new Date());
export const sumarDias = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return aISO(d); };
export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const diaSemana = (fecha: string) => DIAS[new Date(fecha + "T00:00:00").getDay()];
const aMin = (h: string) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
const aHHMM = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const DURACION_MIN = 30;

/* ───────────── Datos semilla ───────────── */
function semilla(): DB {
  const H = hoy();
  const horarios: Horario[] = [];
  let hid = 1;
  const addH = (medico_id: number, dia: string, i: string, f: string, tipo: string) =>
    horarios.push({ id: hid++, medico_id, dia, hora_inicio: i, hora_fin: f, tipo_turno: tipo });
  ["Lunes", "Miércoles", "Jueves"].forEach((d) => addH(2, d, "08:00", "14:00", "Mañana"));
  addH(2, "Viernes", "14:00", "20:00", "Tarde");
  ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].forEach((d) => addH(7, d, "08:00", "18:00", "Completo"));
  ["Martes", "Jueves"].forEach((d) => addH(8, d, "08:00", "14:00", "Mañana"));

  const base = { descripcion_progreso: "", link_google_meet: "", hora_fin: "" };
  const c = (o: Partial<Cita> & Pick<Cita, "id" | "paciente_id" | "especialidad_id" | "fecha" | "estado" | "modalidad" | "motivo" | "prioridad">): Cita => {
    const hi = o.hora_inicio ?? "";
    return { ...base, medico_id: null, hora_inicio: hi, descripcion_triaje: "Prioridad sugerida por triaje (apoyo logístico).", ...o, hora_fin: hi ? aHHMM(aMin(hi) + DURACION_MIN) : "" } as Cita;
  };

  return {
    especialidades: [{ id: 1, nombre: "Cardiología" }, { id: 2, nombre: "Medicina general" }, { id: 3, nombre: "Dermatología" }],
    usuarios: [
      { id: 1, ci: 1000001, email: "Paciente@gmail.com", nombre: "Paciente", telefono: 70000001, rol: "P", estado_disponibilidad: true },
      { id: 2, ci: 2000002, email: "medico2@mail.com", nombre: "Dra. Laura Gómez", telefono: 70000002, rol: "M", especialidad_id: 1, estado_disponibilidad: true },
      { id: 3, ci: 3000003, email: "coordinador2@mail.com", nombre: "Carlos Admin", telefono: 70000003, rol: "C", estado_disponibilidad: true },
      { id: 4, ci: 1000004, email: "carlos.perez@mail.com", nombre: "Carlos Pérez", telefono: 70000004, rol: "P", estado_disponibilidad: true },
      { id: 5, ci: 1000005, email: "maria.gomez@mail.com", nombre: "María Gómez", telefono: 70000005, rol: "P", estado_disponibilidad: true },
      { id: 6, ci: 1000006, email: "lucia.soliz@mail.com", nombre: "Lucía Soliz", telefono: 70000006, rol: "P", estado_disponibilidad: true },
      { id: 7, ci: 2000007, email: "vargas@mail.com", nombre: "Dr. Vargas", telefono: 70000007, rol: "M", especialidad_id: 2, estado_disponibilidad: true },
      { id: 8, ci: 2000008, email: "suarez@mail.com", nombre: "Dra. Suárez", telefono: 70000008, rol: "M", especialidad_id: 3, estado_disponibilidad: true },
      { id: 9, ci: 1000009, email: "jorge.rios@mail.com", nombre: "Jorge Ríos", telefono: 70000009, rol: "P", estado_disponibilidad: true },
    ],
    horarios,
    citas: [
      c({ id: 1, paciente_id: 5, medico_id: 2, especialidad_id: 1, fecha: H, hora_inicio: "09:00", estado: "Confirmada", modalidad: "Presencial", motivo: "Dolor torácico leve", prioridad: "Alta" }),
      c({ id: 2, paciente_id: 4, medico_id: 2, especialidad_id: 1, fecha: H, hora_inicio: "09:30", estado: "Confirmada", modalidad: "Virtual", motivo: "Control de hipertensión", prioridad: "Media", link_google_meet: "https://meet.google.com/abc-defg-hij" }),
      c({ id: 3, paciente_id: 6, medico_id: 2, especialidad_id: 1, fecha: H, hora_inicio: "10:30", estado: "Confirmada", modalidad: "Virtual", motivo: "Resultados de laboratorio", prioridad: "Baja", link_google_meet: "https://meet.google.com/klm-nopq-rst" }),
      c({ id: 4, paciente_id: 1, medico_id: 2, especialidad_id: 1, fecha: sumarDias(1), hora_inicio: "14:00", estado: "Confirmada", modalidad: "Virtual", motivo: "Control cardiológico", prioridad: "Media", link_google_meet: "https://meet.google.com/xyz-abcd-efg" }),
      c({ id: 5, paciente_id: 1, medico_id: 7, especialidad_id: 2, fecha: sumarDias(3), hora_inicio: "15:00", estado: "Confirmada", modalidad: "Presencial", motivo: "Chequeo general", prioridad: "Baja" }),
      c({ id: 6, paciente_id: 1, especialidad_id: 3, fecha: sumarDias(5), estado: "Solicitada", modalidad: "Presencial", motivo: "Revisión de lunar", prioridad: "Baja" }),
      c({ id: 7, paciente_id: 9, medico_id: 2, especialidad_id: 1, fecha: sumarDias(1), hora_inicio: "15:00", estado: "Confirmada", modalidad: "Presencial", motivo: "Controles irregulares", prioridad: "Media" }),
      c({ id: 8, paciente_id: 4, especialidad_id: 2, fecha: sumarDias(1), estado: "Solicitada", modalidad: "Virtual", motivo: "Fiebre desde hace dos días", prioridad: "Media" }),
      c({ id: 9, paciente_id: 5, especialidad_id: 1, fecha: sumarDias(1), estado: "Solicitada", modalidad: "Presencial", motivo: "Dolor en el pecho al esfuerzo", prioridad: "Alta" }),
      c({ id: 10, paciente_id: 5, medico_id: 2, especialidad_id: 1, fecha: sumarDias(-30), hora_inicio: "09:00", estado: "Atendida", modalidad: "Presencial", motivo: "Control de presión", prioridad: "Media" }),
    ],
    diagnosticos: [{ id: 1, cita_id: 10, descripcion: "Hipertensión arterial leve", indicacion: "Dieta baja en sal. Control en 30 días." }],
    recetas: [], detalles_receta: [],
    alergias: [{ id: 1, nombre: "Penicilina" }, { id: 2, nombre: "Ibuprofeno" }, { id: 3, nombre: "Látex" }],
    alergias_usuario: [{ usuario_id: 5, alergia_id: 1 }, { usuario_id: 4, alergia_id: 2 }],
    medicamentos: [
      { id: 1, nombre: "Paracetamol", forma_farmaceutica: "Tableta", concentracion: "500 mg" },
      { id: 2, nombre: "Ibuprofeno", forma_farmaceutica: "Tableta", concentracion: "400 mg" },
      { id: 3, nombre: "Amoxicilina", forma_farmaceutica: "Cápsula", concentracion: "500 mg" },
      { id: 4, nombre: "Losartán", forma_farmaceutica: "Tableta", concentracion: "50 mg" },
      { id: 5, nombre: "Enalapril", forma_farmaceutica: "Tableta", concentracion: "10 mg" },
      { id: 6, nombre: "Atorvastatina", forma_farmaceutica: "Tableta", concentracion: "20 mg" },
      { id: 7, nombre: "Ácido acetilsalicílico", forma_farmaceutica: "Tableta", concentracion: "100 mg" },
      { id: 8, nombre: "Omeprazol", forma_farmaceutica: "Cápsula", concentracion: "20 mg" },
      { id: 9, nombre: "Hidrocortisona", forma_farmaceutica: "Crema", concentracion: "1 %" },
    ],
    sintomas: [{ id: 1, nombre: "Dolor torácico" }, { id: 2, nombre: "Disnea" }, { id: 3, nombre: "Cefalea" }, { id: 4, nombre: "Fiebre" }],
    cita_sintomas: [
      { cita_id: 1, sintoma_id: 1, severidad: "Leve", observacion: "Al realizar esfuerzo", descripcion: "Dolor opresivo en el pecho" },
      { cita_id: 1, sintoma_id: 2, severidad: "Leve", observacion: "Ocasional", descripcion: "Falta de aire al subir escaleras" },
      { cita_id: 2, sintoma_id: 3, severidad: "Leve", observacion: "Por las mañanas", descripcion: "Dolor de cabeza matutino" },
    ],
    evidencias: [],
    alertas: [
      { id: 1, paciente_id: 5, fecha: H, hora: "08:00", diagnostico_principal: "Riesgo cardiovascular", nivel_riesgo: "Alto", patrones_detectados: "Patrón asociado a riesgo cardiovascular", probabilidad_maxima: 0.82, matriz_probabilidades: { Cardiovascular: 0.82, Respiratorio: 0.11, Metabólico: 0.07 } },
      { id: 2, paciente_id: 9, fecha: H, hora: "08:10", diagnostico_principal: "Control irregular", nivel_riesgo: "Medio", patrones_detectados: "Antecedentes y controles irregulares", probabilidad_maxima: 0.61, matriz_probabilidades: { Metabólico: 0.61, Cardiovascular: 0.28, Otro: 0.11 } },
      { id: 3, paciente_id: 4, fecha: H, hora: "08:20", diagnostico_principal: "Hipertensión en seguimiento", nivel_riesgo: "Bajo", patrones_detectados: "Cefalea matutina recurrente", probabilidad_maxima: 0.38, matriz_probabilidades: { Cardiovascular: 0.38, Neurológico: 0.34, Otro: 0.28 } },
    ],
  };
}

/* ───────────── Persistencia + suscripción ───────────── */
const KEY = "cliniq_db_v1";
const EVT = "cliniq-db-change";

export function cargarDB(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const base = semilla();
      const db = { ...base, ...JSON.parse(raw) } as DB;
      // completa campos nuevos de alertas guardadas con versiones anteriores
      db.alertas = db.alertas.map((a) => ({ ...base.alertas.find((x) => x.id === a.id), ...a }));
      return db;
    }
  } catch { /* datos corruptos: se regenera */ }
  const db = semilla();
  localStorage.setItem(KEY, JSON.stringify(db));
  return db;
}
function guardar(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event(EVT));
}
function mutar<T>(fn: (db: DB) => T): T {
  const db = cargarDB();
  const r = fn(db);
  guardar(db);
  return r;
}
export function resetDB() { guardar(semilla()); }

/** Hook: devuelve la BD y se refresca sola (misma pestaña u otra). */
export function useDB(): DB {
  const [db, setDb] = useState<DB>(cargarDB);
  useEffect(() => {
    const sync = () => setDb(cargarDB());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return db;
}

/** Sesión de prueba. Luego usa tu login real (JWT). Para probar otro usuario:
 *  localStorage.setItem("cliniq_usuario_id", "7")  (Dr. Vargas) */
export function usuarioActual(db: DB, rol: Rol): Usuario {
  const id = Number(localStorage.getItem("cliniq_usuario_id"));
  return db.usuarios.find((u) => u.id === id && u.rol === rol) ?? db.usuarios.find((u) => u.rol === rol)!;
}

/* ───────────── Consultas ───────────── */
export const ACTIVAS: EstadoCita[] = ["Confirmada", "En curso"];
export const nombreUsuario = (db: DB, id: number | null) => db.usuarios.find((u) => u.id === id)?.nombre ?? "Por asignar";
export const nombreEspecialidad = (db: DB, id: number) => db.especialidades.find((e) => e.id === id)?.nombre ?? "—";
export const claseEstado = (e: string) => e.toLowerCase().replace(/\s+/g, "-");
export const ordenPrioridad: Record<Prioridad, number> = { Alta: 0, Media: 1, Baja: 2 };

/** Horas libres de un médico en una fecha: según su Horario y sin solapar citas activas. */
export function slotsLibres(db: DB, medico_id: number, fecha: string, ignorarCitaId?: number): string[] {
  if (!fecha) return [];
  const dia = diaSemana(fecha);
  const horas: string[] = [];
  db.horarios.filter((h) => h.medico_id === medico_id && h.dia === dia).forEach((h) => {
    for (let t = aMin(h.hora_inicio); t + DURACION_MIN <= aMin(h.hora_fin); t += DURACION_MIN) horas.push(aHHMM(t));
  });
  const ocupadas = new Set(
    db.citas
      .filter((c) => c.medico_id === medico_id && c.fecha === fecha && ACTIVAS.includes(c.estado) && c.id !== ignorarCitaId)
      .map((c) => c.hora_inicio)
  );
  return horas.filter((h) => !ocupadas.has(h)).sort();
}

/** Médicos de la especialidad que atienden ese día de la semana. */
export function medicosDisponibles(db: DB, especialidad_id: number, fecha: string): Usuario[] {
  if (!fecha) return [];
  const dia = diaSemana(fecha);
  return db.usuarios.filter(
    (u) => u.rol === "M" && u.especialidad_id === especialidad_id && u.estado_disponibilidad &&
      db.horarios.some((h) => h.medico_id === u.id && h.dia === dia)
  );
}

/** Triaje simulado (reemplazar por tu servicio de IA). Solo apoyo logístico, no diagnóstico. */
export function triajeSimple(motivo: string): { prioridad: Prioridad; descripcion_triaje: string } {
  const t = motivo.toLowerCase();
  if (/(torác|pecho|falta de aire|desmayo|sangrado|convuls)/.test(t))
    return { prioridad: "Alta", descripcion_triaje: "Síntomas que sugieren atención prioritaria." };
  if (/(fiebre|dolor|presi|hipert|control|vómito)/.test(t))
    return { prioridad: "Media", descripcion_triaje: "Síntomas de atención pronta." };
  return { prioridad: "Baja", descripcion_triaje: "Sin señales de urgencia detectadas." };
}

/* ───────────── Acciones (cada una = un endpoint futuro) ───────────── */
type Resultado = { ok: true } | { ok: false; error: string };
const nextId = (arr: { id: number }[]) => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1;
const linkMeet = () => {
  const r = (n: number) => Array.from({ length: n }, () => "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]).join("");
  return `https://meet.google.com/${r(3)}-${r(4)}-${r(3)}`;
};

/** POST /api/citas  (paciente solicita o coordinador inserta) → estado Solicitada */
export function crearCita(d: { paciente_id: number; especialidad_id: number; fecha: string; modalidad: Modalidad; motivo: string }): number {
  return mutar((db) => {
    const id = nextId(db.citas);
    const tri = triajeSimple(d.motivo);
    db.citas.push({
      id, paciente_id: d.paciente_id, medico_id: null, especialidad_id: d.especialidad_id,
      fecha: d.fecha, hora_inicio: "", hora_fin: "", estado: "Solicitada", modalidad: d.modalidad,
      link_google_meet: "", descripcion_progreso: "", motivo: d.motivo, ...tri,
    });
    return id;
  });
}

/** PUT /api/citas/:id/confirmar → valida solapamiento y genera link de Meet si es virtual */
export function confirmarCita(id: number, d: { medico_id: number; fecha: string; hora_inicio: string }): Resultado {
  return mutar((db) => {
    const c = db.citas.find((x) => x.id === id);
    if (!c) return { ok: false, error: "La cita no existe." } as Resultado;
    if (!slotsLibres(db, d.medico_id, d.fecha, id).includes(d.hora_inicio))
      return { ok: false, error: "Ese horario no está disponible (fuera del horario del médico o ya ocupado)." } as Resultado;
    Object.assign(c, {
      medico_id: d.medico_id, fecha: d.fecha, hora_inicio: d.hora_inicio,
      hora_fin: aHHMM(aMin(d.hora_inicio) + DURACION_MIN), estado: "Confirmada" as EstadoCita,
      link_google_meet: c.modalidad === "Virtual" ? c.link_google_meet || linkMeet() : "",
    });
    return { ok: true } as Resultado;
  });
}

/** PUT /api/citas/:id/estado */
export function cambiarEstado(id: number, estado: EstadoCita) {
  mutar((db) => { const c = db.citas.find((x) => x.id === id); if (c) c.estado = estado; });
}
export const cancelarCita = (id: number) => cambiarEstado(id, "Cancelada");
export const rechazarCita = (id: number) => cambiarEstado(id, "Rechazada");

/** Vuelve la cita a pendiente con nueva fecha (la coordinación reasigna médico y hora) */
export function reprogramarCita(id: number, fecha: string) {
  mutar((db) => {
    const c = db.citas.find((x) => x.id === id);
    if (c) Object.assign(c, { fecha, medico_id: null, hora_inicio: "", hora_fin: "", link_google_meet: "", estado: "Solicitada" as EstadoCita });
  });
}

/** POST /api/consultas/finalizar → Diagnóstico + Receta + Detalle_Receta */
export function finalizarConsulta(
  cita_id: number,
  d: { diagnostico: string; indicacion: string; medicamentos: Omit<DetalleReceta, "id" | "receta_id">[] }
) {
  mutar((db) => {
    const c = db.citas.find((x) => x.id === cita_id);
    if (!c) return;
    c.estado = "Atendida";
    c.descripcion_progreso = d.diagnostico;
    db.diagnosticos.push({ id: nextId(db.diagnosticos), cita_id, descripcion: d.diagnostico, indicacion: d.indicacion });
    const meds = d.medicamentos.filter((m) => m.medicamento.trim());
    if (meds.length) {
      const receta_id = nextId(db.recetas);
      const ahora = new Date();
      db.recetas.push({ id: receta_id, cita_id, fecha: hoy(), hora: `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`, estado_envio_email: false, pdf_generado_url: "" });
      meds.forEach((m) => db.detalles_receta.push({ id: nextId(db.detalles_receta), receta_id, ...m }));
    }
  });
}

/* ───────────── Alergias ───────────── */
export const alergiasDe = (db: DB, usuario_id: number): string[] =>
  db.alergias_usuario.filter((a) => a.usuario_id === usuario_id)
    .map((a) => db.alergias.find((x) => x.id === a.alergia_id)?.nombre)
    .filter(Boolean) as string[];

const FAMILIAS: Record<string, string[]> = {
  penicilina: ["penicilina", "amoxicilina", "ampicilina"],
  ibuprofeno: ["ibuprofeno", "naproxeno", "diclofenaco"],
};
/** Devuelve la alergia con la que choca el medicamento, o null. */
export function conflictoAlergia(nombreMed: string, alergias: string[]): string | null {
  const m = nombreMed.toLowerCase();
  for (const a of alergias) {
    const k = a.toLowerCase();
    if ((FAMILIAS[k] ?? [k]).some((f) => m.includes(f))) return a;
  }
  return null;
}

/* ───────────── Firma digital + evidencia blockchain ───────────── */
// Prueba: el hash SHA-256 y la firma ECDSA (P-256) son REALES (WebCrypto).
// La clave privada queda en localStorage SOLO para pruebas. En producción va en una wallet/HSM.
// El anclaje en la red es SIMULADO: reemplaza anclarEnBlockchain() por tu transacción real.
const enc = new TextEncoder();
const aHex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
const aB64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));
const deB64 = (s: string) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));
const ALG = { name: "ECDSA", namedCurve: "P-256" };
const FIRMA = { name: "ECDSA", hash: "SHA-256" };

export async function sha256(texto: string): Promise<string> {
  return aHex(await crypto.subtle.digest("SHA-256", enc.encode(texto)));
}

/** Documento canónico (orden fijo de campos) que se hashea y se firma. */
export function construirDocumento(db: DB, cita_id: number): string {
  const c = db.citas.find((x) => x.id === cita_id)!;
  const dg = db.diagnosticos.filter((d) => d.cita_id === cita_id).slice(-1)[0];
  const r = db.recetas.find((x) => x.cita_id === cita_id);
  const medicamentos = r
    ? db.detalles_receta.filter((d) => d.receta_id === r.id).map((d) => ({
        medicamento: d.medicamento, dosis: d.dosis, frecuencia: d.frecuencia, duracion: d.duracion, via_administracion: d.via_administracion,
      }))
    : [];
  return JSON.stringify({
    cita_id: c.id, paciente_id: c.paciente_id, medico_id: c.medico_id, fecha: c.fecha, hora_inicio: c.hora_inicio,
    diagnostico: dg?.descripcion ?? "", indicacion: dg?.indicacion ?? "", medicamentos,
  });
}

async function clavesDelMedico(medico_id: number): Promise<{ priv: string; pub: string }> {
  const kPriv = "cliniq_privkey_" + medico_id;
  const priv = localStorage.getItem(kPriv);
  const u = cargarDB().usuarios.find((x) => x.id === medico_id)!;
  if (priv && u.blockchain_pub_key) return { priv, pub: u.blockchain_pub_key };
  const par = await crypto.subtle.generateKey(ALG, true, ["sign", "verify"]);
  const privJwk = JSON.stringify(await crypto.subtle.exportKey("jwk", par.privateKey));
  const pubJwk = JSON.stringify(await crypto.subtle.exportKey("jwk", par.publicKey));
  localStorage.setItem(kPriv, privJwk);
  mutar((db) => { db.usuarios.find((x) => x.id === medico_id)!.blockchain_pub_key = pubJwk; });
  return { priv: privJwk, pub: pubJwk };
}

/** SIMULADO. Reemplazar por el envío real del hash a la red (ethers.js, Hyperledger, etc.) y devolver el tx hash. */
async function anclarEnBlockchain(hash: string): Promise<string> {
  return "0x" + (await sha256(hash + Date.now() + Math.random()));
}

/** Guarda diagnóstico + receta, marca la cita Atendida, firma el documento y registra la evidencia. */
export async function emitirExpediente(
  cita_id: number,
  d: { diagnostico: string; indicacion: string; medicamentos: Omit<DetalleReceta, "id" | "receta_id">[] }
): Promise<EvidenciaBlockchain> {
  const medico_id = cargarDB().citas.find((c) => c.id === cita_id)!.medico_id!;
  finalizarConsulta(cita_id, { diagnostico: d.diagnostico.trim(), indicacion: d.indicacion.trim(), medicamentos: d.medicamentos });

  const hash = await sha256(construirDocumento(cargarDB(), cita_id));
  const { priv, pub } = await clavesDelMedico(medico_id);
  const clave = await crypto.subtle.importKey("jwk", JSON.parse(priv), ALG, false, ["sign"]);
  const firma = aB64(await crypto.subtle.sign(FIRMA, clave, enc.encode(hash)));
  const tx = await anclarEnBlockchain(hash);

  const ahora = new Date();
  return mutar((db) => {
    const ev: EvidenciaBlockchain = {
      id: nextId(db.evidencias), cita_id, hash_documento: hash, tx_hash_red: tx,
      fecha: hoy(), hora: `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`, medico_pub_key: pub, firma,
    };
    db.evidencias.push(ev);
    return ev;
  });
}

/** Recalcula el hash con lo guardado y valida la firma con la clave pública. */
export async function verificarEvidencia(db: DB, ev: EvidenciaBlockchain): Promise<{ hashOk: boolean; firmaOk: boolean }> {
  const hashOk = (await sha256(construirDocumento(db, ev.cita_id))) === ev.hash_documento;
  let firmaOk = false;
  try {
    const clave = await crypto.subtle.importKey("jwk", JSON.parse(ev.medico_pub_key), ALG, false, ["verify"]);
    firmaOk = await crypto.subtle.verify(FIRMA, clave, deB64(ev.firma), enc.encode(ev.hash_documento));
  } catch { /* clave o firma inválidas */ }
  return { hashOk, firmaOk };
}

/** PUT /api/alertas/:id/revisada */
export function marcarAlertaRevisada(id: number, revisada = true) {
  mutar((db) => { const a = db.alertas.find((x) => x.id === id); if (a) a.revisada = revisada; });
}