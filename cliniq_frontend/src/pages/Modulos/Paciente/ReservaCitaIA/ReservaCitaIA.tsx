import React, { useEffect, useRef, useState } from "react";
import "./ReservaCitaIA.css";
import { authService } from "../../../../services/authService";
import {
  ALARMAS,
  AREAS_ETIQUETA,
  ENFERMEDADES,
  MAX_MOTIVOS,
  MOTIVOS,
  OPCIONES_DURACION,
  OPCIONES_EVOLUCION,
  OPCIONES_INICIO,
  SEXOS,
} from "./catalogoTriaje";
import type { OpcionCatalogo } from "./catalogoTriaje";

export type Prioridad = "rojo" | "naranja" | "amarillo" | "verde" | "azul";

interface TriajeRegistrado {
  id: string;
  sintoma: string;
  nivel: string;
  colorBadge: Prioridad;
  tiempo: string;
}

interface ResultadoVisualIA {
  clasificacion: string;
  color: Prioridad;
  mensaje: string;
  area: string;
  aviso: string;
  requiereRevision: boolean;
}

const NIVELES: Record<Prioridad, string> = {
  rojo: "Nivel 1 - Emergencia",
  naranja: "Nivel 2 - Muy urgente",
  amarillo: "Nivel 3 - Urgente",
  verde: "Nivel 4 - Poco urgente",
  azul: "Nivel 5 - No urgente",
};

const CLAVE_ENFERMEDADES = "cliniq_enfermedades_habituales";

/* ================= UTILIDADES ================= */
const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const simularTriajeFrontend = (datos: {
  edad: number;
  sexo: string;
  embarazo: string;
  alarmas: string[];
  intensidad: number;
  temperatura?: number;
}): { prioridad: Prioridad; mensaje: string; area: string; aviso: string; requiereRevision: boolean } => {
  const { edad, embarazo, alarmas, intensidad, temperatura } = datos;

  let prioridad: Prioridad = "verde";
  let mensaje = "Atención ambulatoria estándar recomendada en las próximas horas.";
  let area = "Medicina General";
  let aviso = "Si los síntomas empeoran o nota mareos intensos, acérquese a Emergencias.";
  let requiereRevision = false;

  if (alarmas.length >= 2 || intensidad === 10 || (temperatura !== undefined && (temperatura >= 40 || temperatura <= 35))) {
    prioridad = "rojo";
    mensaje = "Requiere atención médica de reanimación o estabilización inmediata.";
    area = "Emergencias / Shock Room";
    aviso = "Acuda de inmediato a la sala de emergencias más cercana o solicite auxilio médico.";
  } else if (alarmas.length === 1 || intensidad >= 8 || (temperatura !== undefined && temperatura >= 39)) {
    prioridad = "naranja";
    mensaje = "Cuadro clínico con compromiso significativo. Requiere evaluación médica prioritaria (< 15 min).";
    area = "Emergencias / Guardia";
    aviso = "Evite esfuerzos físicos y diríjase al centro médico a la brevedad.";
    requiereRevision = true;
  } else if (intensidad >= 5 || (temperatura !== undefined && temperatura >= 38)) {
    prioridad = "amarillo";
    mensaje = "Situación de urgencia relativa. Tiempo de espera objetivo menor a 60 minutos.";
    area = "Consulta Médica Prioritaria";
    aviso = "Manténgase hidratado y permanezca en observación mientras espera la atención.";
  } else if (intensidad <= 2 && alarmas.length === 0) {
    prioridad = "azul";
    mensaje = "Proceso banal o administrativo. No requiere atención inmediata.";
    area = "Consulta Externa / Preventiva";
    aviso = "Puede agendar su cita en los horarios habituales de consulta externa.";
  }

  if (prioridad !== "rojo") {
    if (embarazo === "si") {
      area = "Ginecología y Obstetricia";
    } else if (edad <= 12) {
      area = "Pediatría";
    }
  }

  return { prioridad, mensaje, area, aviso, requiereRevision };
};

const leerEnfermedadesGuardadas = (): string[] | null => {
  try {
    const crudo = localStorage.getItem(CLAVE_ENFERMEDADES);
    if (crudo === null) return null;
    const lista: unknown = JSON.parse(crudo);
    if (!Array.isArray(lista)) return null;
    const validas = new Set(ENFERMEDADES.map((e) => e.id));
    return lista.filter((x): x is string => typeof x === "string" && validas.has(x));
  } catch {
    return null;
  }
};

/* ================= ICONOS ================= */
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const IcoUser = () => (<Svg><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></Svg>);
const IcoSearch = () => (<Svg><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Svg>);
const IcoPulse = () => (<Svg><path d="M3 12h4l3-8 4 16 3-8h4" /></Svg>);
const IcoSpark = () => (<Svg><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /></Svg>);
const IcoCheck = () => (<Svg><path d="M20 6L9 17l-5-5" /></Svg>);
const IcoShield = () => (<Svg><path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6l8-3z" /></Svg>);
const IcoLayers = () => (<Svg><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></Svg>);
const IcoClock = () => (<Svg><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>);

const Flecha = () => <span className="flow-arrow" aria-hidden="true">→</span>;

/* ================= SELECTOR MÚLTIPLE CON BUSCADOR ================= */
interface MultiSelectProps {
  id: string;
  etiqueta: string;
  ayuda?: string;
  placeholder: string;
  opciones: OpcionCatalogo[];
  seleccionados: string[];
  onChange: (ids: string[]) => void;
  max?: number;
  variante?: "alarma";
}

const MultiSelectBuscador: React.FC<MultiSelectProps> = ({
  id, etiqueta, ayuda, placeholder, opciones, seleccionados, onChange, max, variante,
}) => {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lleno = max !== undefined && seleccionados.length >= max;
  const q = normalizar(busqueda.trim());
  const sugerencias = opciones.filter(
    (o) =>
      !seleccionados.includes(o.id) &&
      (q === "" ||
        normalizar(o.etiqueta).includes(q) ||
        (o.grupo !== undefined && normalizar(o.grupo).includes(q)))
  );

  const etiquetaDe = (idOpcion: string) =>
    opciones.find((o) => o.id === idOpcion)?.etiqueta ?? idOpcion;

  const agregar = (idOpcion: string) => {
    if (lleno) return;
    onChange([...seleccionados, idOpcion]);
    setBusqueda("");
    setAbierto(false);
  };

  const quitar = (idOpcion: string) => onChange(seleccionados.filter((s) => s !== idOpcion));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!lleno && sugerencias.length > 0) agregar(sugerencias[0].id);
    } else if (e.key === "Backspace" && busqueda === "" && seleccionados.length > 0) {
      quitar(seleccionados[seleccionados.length - 1]);
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  };

  return (
    <div className="form-group full-width sintomas-wrap">
      <div className="label-row">
        <label htmlFor={id}>{etiqueta}</label>
        <span className="contador">
          {seleccionados.length}
          {max !== undefined ? `/${max}` : ""} seleccionados
        </span>
      </div>
      {ayuda && <p className="form-hint">{ayuda}</p>}

      <div
        className={`sintomas-input-container ${abierto ? "focus" : ""}`}
        onClick={() => { inputRef.current?.focus(); setAbierto(true); }}
      >
        <div className="sintomas-tags">
          {seleccionados.map((s) => (
            <span key={s} className={`sintoma-tag ${variante ?? ""}`}>
              {etiquetaDe(s)}{" "}
              <button type="button" aria-label={`Quitar ${etiquetaDe(s)}`} onClick={() => quitar(s)}>
                &times;
              </button>
            </span>
          ))}
        </div>
        <input
          id={id}
          ref={inputRef}
          type="text"
          autoComplete="off"
          className="sintomas-search"
          placeholder={seleccionados.length === 0 ? placeholder : "Añadir otro..."}
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setAbierto(false)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {abierto && (
        <ul className="sintomas-dropdown" role="listbox" onMouseDown={(e) => e.preventDefault()}>
          {lleno ? (
            <li className="no-results aviso-max">
              Alcanzaste el máximo de {max}. Quita uno para agregar otro.
            </li>
          ) : sugerencias.length === 0 ? (
            <li className="no-results">
              {busqueda ? <>Sin resultados para <b>"{busqueda}"</b>.</> : "No hay más opciones."}
            </li>
          ) : (
            sugerencias.map((o, i) => (
              <React.Fragment key={o.id}>
                {o.grupo && o.grupo !== sugerencias[i - 1]?.grupo && (
                  <li className="grupo-titulo">{o.grupo}</li>
                )}
                <li role="option" aria-selected={false} onMouseDown={() => agregar(o.id)}>
                  {o.etiqueta}
                </li>
              </React.Fragment>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

/* ================= LISTA DESPLEGABLE SIMPLE ================= */
interface SelectCampoProps {
  id: string;
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  opciones: ReadonlyArray<{ id: string; etiqueta: string }>;
  fullWidth?: boolean;
}

const SelectCampo: React.FC<SelectCampoProps> = ({ id, etiqueta, valor, onChange, opciones, fullWidth }) => (
  <div className={`form-group ${fullWidth ? "full-width" : ""}`}>
    <label htmlFor={id}>{etiqueta}</label>
    <select id={id} value={valor} onChange={(e) => onChange(e.target.value)} required>
      <option value="">Selecciona...</option>
      {opciones.map((o) => (
        <option key={o.id} value={o.id}>{o.etiqueta}</option>
      ))}
    </select>
  </div>
);

/* ================= COMPONENTE ================= */
export const ReservaCitaIA: React.FC = () => {
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState<"" | "M" | "F">("");
  const [embarazo, setEmbarazo] = useState<"" | "si" | "no">("");

  const [motivos, setMotivos] = useState<string[]>([]);
  const [alarmas, setAlarmas] = useState<string[]>([]);
  const [enfermedades, setEnfermedades] = useState<string[]>(() => leerEnfermedadesGuardadas() ?? []);
  const [recordarEnfermedades, setRecordarEnfermedades] = useState<boolean>(
    () => leerEnfermedadesGuardadas() !== null
  );

  const [intensidad, setIntensidad] = useState(5);
  const [inicio, setInicio] = useState("");
  const [duracion, setDuracion] = useState("");
  const [evolucion, setEvolucion] = useState("");

  const [temperatura, setTemperatura] = useState("");

  const [cargando, setCargando] = useState(false);
  const [errorIA, setErrorIA] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoVisualIA | null>(null);
  const [historial, setHistorial] = useState<TriajeRegistrado[]>([]);

  useEffect(() => {
    try {
      const u = authService?.getCurrentUser?.();
      if (u?.nombre) setNombrePaciente(u.nombre);
    } catch {
      /* sesión opcional */
    }
  }, []);

  useEffect(() => {
    try {
      if (recordarEnfermedades) localStorage.setItem(CLAVE_ENFERMEDADES, JSON.stringify(enfermedades));
      else localStorage.removeItem(CLAVE_ENFERMEDADES);
    } catch {
      /* almacenamiento no disponible */
    }
  }, [recordarEnfermedades, enfermedades]);

  const edadNum = edad === "" ? NaN : Number(edad);
  const pideEmbarazo = sexo === "F" && Number.isFinite(edadNum) && edadNum >= 13;

  useEffect(() => {
    if (!pideEmbarazo) setEmbarazo("");
  }, [pideEmbarazo]);

  useEffect(() => {
    if (!sexo) return;
    const compatible = (lista: OpcionCatalogo[], idOpcion: string) => {
      const o = lista.find((x) => x.id === idOpcion);
      return !o?.sexo || o.sexo === sexo;
    };
    setMotivos((prev) => prev.filter((i) => compatible(MOTIVOS, i)));
    setAlarmas((prev) => prev.filter((i) => compatible(ALARMAS, i)));
  }, [sexo]);

  const segunSexo = (lista: OpcionCatalogo[]) =>
    lista.filter((o) => !o.sexo || !sexo || o.sexo === sexo);

  const limpiarFormulario = () => {
    setEdad(""); setSexo(""); setEmbarazo("");
    setMotivos([]); setAlarmas([]);
    setIntensidad(5); setInicio(""); setDuracion(""); setEvolucion("");
    setTemperatura("");
    setResultado(null); setErrorIA(null);
  };

  const handleAnalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultado(null);
    setErrorIA(null);

    if (!Number.isFinite(edadNum) || edadNum < 0 || edadNum > 120) {
      setErrorIA("Ingrese una edad válida (0 a 120 años; 0 si es menor de 1 año).");
      return;
    }
    if (sexo === "") {
      setErrorIA("Seleccione el sexo del paciente.");
      return;
    }
    if (pideEmbarazo && embarazo === "") {
      setErrorIA("Indique si la paciente está embarazada.");
      return;
    }
    if (motivos.length === 0) {
      setErrorIA("Debe seleccionar al menos un motivo de consulta.");
      return;
    }
    if (inicio === "" || duracion === "" || evolucion === "") {
      setErrorIA("Complete cómo empezó, cuánto tiempo lleva y cómo evoluciona el malestar.");
      return;
    }

    let tempNum: number | undefined;
    if (temperatura.trim() !== "") {
      tempNum = Number(temperatura.replace(",", "."));
      if (!Number.isFinite(tempNum) || tempNum < 34 || tempNum > 42) {
        setErrorIA("La temperatura debe estar entre 34 y 42 °C (o déjela vacía).");
        return;
      }
    }

    setCargando(true);

    setTimeout(() => {
      try {
        const evaluacion = simularTriajeFrontend({
          edad: edadNum,
          sexo,
          embarazo,
          alarmas,
          intensidad,
          temperatura: tempNum,
        });

        const nivel = NIVELES[evaluacion.prioridad];

        setResultado({
          clasificacion: nivel,
          color: evaluacion.prioridad,
          mensaje: evaluacion.mensaje,
          area: AREAS_ETIQUETA[evaluacion.area] ?? evaluacion.area,
          aviso: evaluacion.aviso,
          requiereRevision: evaluacion.requiereRevision,
        });

        const etiquetas = motivos
          .map((m) => MOTIVOS.find((o) => o.id === m)?.etiqueta ?? m)
          .join(", ");

        setHistorial((prev) => [
          {
            id: `PAC-${Math.floor(Math.random() * 9000) + 1000}`,
            sintoma: etiquetas,
            nivel,
            colorBadge: evaluacion.prioridad,
            tiempo: new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" }),
          },
          ...prev,
        ]);
      } catch (err) {
        setErrorIA(err instanceof Error ? err.message : "Error al procesar la evaluación");
      } finally {
        setCargando(false);
      }
    }, 600);
  };

  return (
    <div className="reserva-page">
      <header className="reserva-hero">
        <h2>Reserva de Cita con IA</h2>
        <p>
          Describe tus síntomas y signos vitales. El asistente prioriza tu atención usando como
          referencia los cinco niveles de la <b>Escala Manchester</b> y te sugiere el área de derivación.
        </p>
      </header>

      <section className="flow-grid" aria-label="Proceso de reserva">
        <div className="flow-card">
          <div className="flow-icon"><IcoUser /></div>
          <div className="flow-text"><span className="flow-label">Paso 1</span><strong>Confirma tus datos.</strong></div>
        </div>
        <Flecha />
        <div className="flow-card">
          <div className="flow-icon"><IcoSearch /></div>
          <div className="flow-text"><span className="flow-label">Paso 2</span><strong>Indica tus síntomas.</strong></div>
        </div>
        <Flecha />
        <div className="flow-card">
          <div className="flow-icon"><IcoPulse /></div>
          <div className="flow-text"><span className="flow-label">Paso 3</span><strong>Ingresa tu temperatura.</strong></div>
        </div>
        <Flecha />
        <div className="flow-card">
          <div className="flow-icon"><IcoSpark /></div>
          <div className="flow-text"><span className="flow-label">Paso 4</span><strong>La IA clasifica tu caso.</strong></div>
        </div>
      </section>

      <section className="flow-grid flow-grid-info" aria-label="Información del módulo">
        <div className="flow-card">
          <div className="flow-icon"><IcoCheck /></div>
          <div className="flow-text"><span className="flow-label">Atendidos hoy</span><strong>48 pacientes.</strong></div>
        </div>
        <div className="flow-card">
          <div className="flow-icon"><IcoShield /></div>
          <div className="flow-text"><span className="flow-label">Tipo de IA</span><strong>Reglas Manchester en tiempo real.</strong></div>
        </div>
        <div className="flow-card">
          <div className="flow-icon"><IcoLayers /></div>
          <div className="flow-text"><span className="flow-label">Escala</span><strong>Manchester de 5 niveles.</strong></div>
        </div>
        <div className="flow-card">
          <div className="flow-icon"><IcoClock /></div>
          <div className="flow-text"><span className="flow-label">Respuesta</span><strong>Resultado inmediato.</strong></div>
        </div>
      </section>

      <div className="reserva-layout">
        <section className="reserva-panel">
          <div className="panel-head">
            <div className="flow-icon"><IcoPulse /></div>
            <div>
              <h3>Registro y evaluación clínica</h3>
              <p>Completa el formulario para clasificar tu caso.</p>
            </div>
          </div>

          <form onSubmit={handleAnalizar} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}>
            <div className="form-grid">
              <h4 className="form-section-title">Datos del paciente</h4>

              <div className="form-group full-width">
                <label htmlFor="nombre">Nombre completo del paciente</label>
                <input id="nombre" type="text" value={nombrePaciente} onChange={(e) => setNombrePaciente(e.target.value)} required />
              </div>

              <div className="form-group">
                <label htmlFor="edad">Edad (años)</label>
                <input id="edad" type="number" min={0} max={120} step={1} placeholder="0 si es menor de 1 año"
                  value={edad} onChange={(e) => setEdad(e.target.value)} required />
              </div>

              <SelectCampo id="sexo" etiqueta="Sexo" valor={sexo}
                onChange={(v) => setSexo(v === "M" || v === "F" ? v : "")} opciones={SEXOS} />

              {pideEmbarazo && (
                <SelectCampo id="embarazo" etiqueta="¿Está embarazada?" valor={embarazo}
                  onChange={(v) => setEmbarazo(v === "si" || v === "no" ? v : "")}
                  opciones={[{ id: "si", etiqueta: "Sí" }, { id: "no", etiqueta: "No" }]} fullWidth />
              )}

              <h4 className="form-section-title">Motivos de consulta</h4>
              <MultiSelectBuscador
                id="motivos"
                etiqueta="Sintomatología / motivos de consulta"
                ayuda={`Busca y elige hasta ${MAX_MOTIVOS} motivos. Algunas opciones dependen del sexo indicado arriba.`}
                placeholder="Buscar motivo (Ej. Fiebre, Dolor, Tos...)"
                opciones={segunSexo(MOTIVOS)}
                seleccionados={motivos}
                onChange={setMotivos}
                max={MAX_MOTIVOS}
              />

              <h4 className="form-section-title">Señales de alarma</h4>
              <MultiSelectBuscador
                id="alarmas"
                etiqueta="¿Presenta alguna de estas señales de alarma?"
                ayuda="Elige todas las que apliquen. Si no presenta ninguna, déjalo vacío."
                placeholder="Buscar señal (Ej. Sangrado, Respirar...)"
                opciones={segunSexo(ALARMAS)}
                seleccionados={alarmas}
                onChange={setAlarmas}
                variante="alarma"
              />

              <h4 className="form-section-title">Antecedentes</h4>
              <MultiSelectBuscador
                id="enfermedades"
                etiqueta="Enfermedades o condiciones previas"
                ayuda="Elige todas las que apliquen. Si no tiene ninguna, déjalo vacío."
                placeholder="Buscar enfermedad (Ej. Diabetes, Asma...)"
                opciones={ENFERMEDADES}
                seleccionados={enfermedades}
                onChange={setEnfermedades}
              />
              <div className="form-group full-width">
                <label className="check-row">
                  <input type="checkbox" checked={recordarEnfermedades}
                    onChange={(e) => setRecordarEnfermedades(e.target.checked)} />
                  Recordar estas enfermedades para próximas consultas (se guardan solo en este navegador)
                </label>
              </div>

              <h4 className="form-section-title">Detalle del malestar</h4>
              <div className="form-group full-width">
                <label htmlFor="intensidad">
                  Intensidad del malestar: <b>{intensidad}/10</b>
                </label>
                <input id="intensidad" type="range" min={0} max={10} step={1} value={intensidad}
                  onChange={(e) => setIntensidad(Number(e.target.value))} />
                <p className="form-hint">0 = ninguna molestia, 10 = el peor malestar imaginable.</p>
              </div>

              <SelectCampo id="inicio" etiqueta="¿Cómo empezó?" valor={inicio} onChange={setInicio} opciones={OPCIONES_INICIO} />
              <SelectCampo id="duracion" etiqueta="¿Hace cuánto tiempo?" valor={duracion} onChange={setDuracion} opciones={OPCIONES_DURACION} />
              <SelectCampo id="evolucion" etiqueta="¿Cómo evoluciona?" valor={evolucion} onChange={setEvolucion} opciones={OPCIONES_EVOLUCION} fullWidth />

              {/* ---------- Temperatura (Signo vital opcional) ---------- */}
              <h4 className="form-section-title">Signos vitales</h4>
              <div className="form-group full-width">
                <label htmlFor="temperatura">
                  Temperatura (°C) <span style={{ fontWeight: "normal", color: "#6b7280" }}>(opcional)</span>
                </label>
                <input
                  id="temperatura"
                  type="number"
                  step="0.1"
                  min={34}
                  max={42}
                  placeholder="Ej. 37.5 (deja vacío si no dispones de termómetro)"
                  value={temperatura}
                  onChange={(e) => setTemperatura(e.target.value)}
                />
              </div>
            </div>

            {errorIA && <div className="error-ia" role="alert">{errorIA}</div>}

            <button type="submit" className="btn-primary-action" disabled={cargando}>
              {cargando ? "Evaluando con IA..." : "Clasificar y reservar con IA"}
            </button>
            <button type="button" className="btn-secondary-action" onClick={limpiarFormulario} disabled={cargando}>
              Limpiar formulario
            </button>
          </form>

          {resultado && (
            <div className={`resultado-ia-box nivel-${resultado.color}`} aria-live="polite">
              <div className="resultado-ia-header">
                <span className="resultado-ia-title">Resultado de evaluación ClinIQ</span>
                <span className={`badge-prioridad ${resultado.color}`}>{resultado.clasificacion}</span>
              </div>
              <p className="resultado-ia-desc"><b>Qué hacer:</b> {resultado.mensaje}</p>
              <p className="resultado-ia-desc"><b>Área sugerida:</b> {resultado.area}</p>
              {resultado.requiereRevision && (
                <p className="resultado-ia-desc resultado-ia-nota">
                  El sistema tiene poca certeza en este caso: por precaución, confirma tu prioridad
                  con personal de salud.
                </p>
              )}
              <p className="resultado-ia-desc resultado-ia-aviso">{resultado.aviso}</p>
            </div>
          )}
        </section>

        <section className="reserva-panel">
          <div className="panel-head">
            <div className="flow-icon"><IcoClock /></div>
            <div>
              <h3>Mis últimas clasificaciones</h3>
              <p>Resultados de esta sesión.</p>
            </div>
          </div>

          <div className="recent-list">
            {historial.length === 0 && <p className="text-muted">Aún no has realizado ninguna clasificación.</p>}
            {historial.map((item) => (
              <div className="recent-item" key={item.id}>
                <div>
                  <div className="recent-patient-name">{item.sintoma}</div>
                  <div className="recent-patient-desc">{item.id}</div>
                </div>
                <div className="recent-right">
                  <span className={`badge-text ${item.colorBadge}`}>{item.nivel}</span>
                  <div className="recent-time">{item.tiempo}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReservaCitaIA;