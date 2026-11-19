import React, { useState } from "react";
import "./InicioCoordinador.css";
import "../../ClinIQExtras.css";
import {
  useDB, crearCita, confirmarCita, cancelarCita, rechazarCita, reprogramarCita, resetDB,
  slotsLibres, medicosDisponibles, hoy, nombreUsuario, nombreEspecialidad, claseEstado,
  ordenPrioridad, type Cita, type Modalidad,
} from "../../clinicDb";

type Sel = { medico_id?: number; fecha?: string; hora?: string };

export const InicioCoordinador: React.FC = () => {
  const db = useDB();

  const [sel, setSel] = useState<Record<number, Sel>>({});
  const [filtroMedico, setFiltroMedico] = useState(0);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [aviso, setAviso] = useState("");
  const [form, setForm] = useState({
    paciente_id: 0, especialidad_id: 0, fecha: "", modalidad: "Presencial" as Modalidad,
    motivo: "", medico_id: 0, hora: "",
  });

  const pacientes = db.usuarios.filter((u) => u.rol === "P");
  const medicos = db.usuarios.filter((u) => u.rol === "M");

  // Las tres columnas del tablero
  const pendientes = db.citas
    .filter((c) => c.estado === "Solicitada")
    .sort((a, b) => ordenPrioridad[a.prioridad] - ordenPrioridad[b.prioridad] || a.fecha.localeCompare(b.fecha));
  const confirmadas = db.citas
    .filter((c) => (c.estado === "Confirmada" || c.estado === "En curso") && (!filtroMedico || c.medico_id === filtroMedico))
    .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio));
  const cerradas = db.citas
    .filter((c) => ["Atendida", "Cancelada", "Rechazada"].includes(c.estado))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  /* ── Aprobar una solicitud pendiente ── */
  const cambiarSel = (id: number, parcial: Sel) => setSel((p) => ({ ...p, [id]: { ...p[id], ...parcial } }));
  const aprobar = (c: Cita) => {
    const s = sel[c.id];
    if (!s?.medico_id || !s?.hora) return;
    const r = confirmarCita(c.id, { medico_id: s.medico_id, fecha: s.fecha ?? c.fecha, hora_inicio: s.hora });
    setAviso(r.ok ? "" : r.error);
  };

  /* ── Insertar una cita nueva ── */
  const espForm = form.especialidad_id || db.especialidades[0].id;
  const pacForm = form.paciente_id || pacientes[0]?.id;
  const medicosForm = medicosDisponibles(db, espForm, form.fecha);
  const horasForm = form.medico_id ? slotsLibres(db, form.medico_id, form.fecha) : [];

  const insertar = (confirmar: boolean) => {
    if (!form.fecha || !form.motivo.trim()) return setAviso("Indica la fecha y el motivo.");
    const id = crearCita({ paciente_id: pacForm, especialidad_id: espForm, fecha: form.fecha, modalidad: form.modalidad, motivo: form.motivo.trim() });
    if (confirmar) {
      if (!form.medico_id || !form.hora) return setAviso("Para confirmar elige médico y hora (la cita quedó como pendiente).");
      const r = confirmarCita(id, { medico_id: form.medico_id, fecha: form.fecha, hora_inicio: form.hora });
      if (!r.ok) return setAviso(r.error + " La cita quedó como pendiente.");
    }
    setAviso("");
    setForm({ ...form, motivo: "", fecha: "", medico_id: 0, hora: "" });
  };

  const CardDatos = ({ c }: { c: Cita }) => (
    <div className="coo-info" style={{ minWidth: 0 }}>
      <h3>
        {nombreUsuario(db, c.paciente_id)}
        <span className={`coo-prio coo-prio--${c.prioridad.toLowerCase()}`}>Prioridad {c.prioridad}</span>
      </h3>
      <p>{nombreEspecialidad(db, c.especialidad_id)} · {c.modalidad}</p>
      <p>{c.motivo}</p>
    </div>
  );

  return (
    <div className="coo-page">
      <header className="coo-cabecera">
        <div className="coo-avatar">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h1>Gestión de Citas</h1>
          <p>Recibe las solicitudes de los pacientes y asígnales médico y horario. Tú confirmas cada cita.</p>
        </div>
      </header>

      <div className="coo-stats">
        <div className="coo-stat"><span>Solicitudes por asignar</span><strong>{pendientes.length}</strong></div>
        <div className="coo-stat"><span>Citas confirmadas</span><strong>{db.citas.filter((c) => c.estado === "Confirmada").length}</strong></div>
        <div className="coo-stat"><span>Médicos disponibles hoy</span><strong>{medicos.filter((m) => slotsLibres(db, m.id, hoy()).length > 0).length}</strong></div>
        <div className="coo-stat"><span>Canceladas</span><strong>{db.citas.filter((c) => c.estado === "Cancelada").length}</strong></div>
      </div>

      {aviso && <p className="frm-aviso" role="alert">{aviso}</p>}

      {/* ── Insertar cita ── */}
      <section className="coo-tarjeta">
        <div className="coo-tarjeta-cab">
          <div>
            <h2>Insertar cita</h2>
            <p>Registra una cita a nombre de un paciente: déjala pendiente o confírmala directamente.</p>
          </div>
          <button className="coo-btn" onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? "Cerrar" : "+ Nueva cita"}</button>
        </div>

        {mostrarForm && (
          <div className="frm" style={{ marginBottom: 0 }}>
            <label className="frm-campo"><span>Paciente</span>
              <select value={pacForm} onChange={(e) => setForm({ ...form, paciente_id: Number(e.target.value) })}>
                {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </label>
            <label className="frm-campo"><span>Especialidad</span>
              <select value={espForm} onChange={(e) => setForm({ ...form, especialidad_id: Number(e.target.value), medico_id: 0, hora: "" })}>
                {db.especialidades.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </label>
            <label className="frm-campo"><span>Fecha</span>
              <input type="date" min={hoy()} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value, medico_id: 0, hora: "" })} />
            </label>
            <label className="frm-campo"><span>Modalidad</span>
              <select value={form.modalidad} onChange={(e) => setForm({ ...form, modalidad: e.target.value as Modalidad })}>
                <option>Presencial</option><option>Virtual</option>
              </select>
            </label>
            <label className="frm-campo frm-ancho"><span>Motivo</span>
              <input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Motivo de la consulta" />
            </label>
            <label className="frm-campo"><span>Médico (opcional)</span>
              <select value={form.medico_id} onChange={(e) => setForm({ ...form, medico_id: Number(e.target.value), hora: "" })}>
                <option value={0}>{form.fecha ? "Seleccionar" : "Elige una fecha"}</option>
                {medicosForm.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </label>
            <label className="frm-campo"><span>Hora (opcional)</span>
              <select value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} disabled={!form.medico_id}>
                <option value="">Seleccionar</option>
                {horasForm.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
            <div className="frm-acciones">
              <button className="coo-btn" onClick={() => insertar(false)}>Insertar como pendiente</button>
              <button className="coo-btn coo-btn--solido" disabled={!form.medico_id || !form.hora} onClick={() => insertar(true)}>Insertar y confirmar</button>
            </div>
          </div>
        )}
      </section>

      {/* ── Tablero ── */}
      <div className="coo-barra">
        <label className="coo-campo">
          <span>Filtrar confirmadas por médico</span>
          <select value={filtroMedico} onChange={(e) => setFiltroMedico(Number(e.target.value))}>
            <option value={0}>Todos</option>
            {medicos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </label>
      </div>

      <div className="coo-tablero">
        {/* Pendientes */}
        <section className="coo-col coo-col--pend">
          <div className="coo-col-cab">
            <h2>Pendientes<small>Ordenadas por prioridad sugerida</small></h2>
            <span className="coo-contador">{pendientes.length}</span>
          </div>
          <div className="coo-lista">
            {pendientes.length === 0 && <p className="coo-vacio">No hay solicitudes pendientes.</p>}
            {pendientes.map((c) => {
              const fecha = sel[c.id]?.fecha ?? c.fecha;
              const opcMedicos = medicosDisponibles(db, c.especialidad_id, fecha);
              const medico_id = sel[c.id]?.medico_id;
              const horas = medico_id ? slotsLibres(db, medico_id, fecha) : [];
              return (
                <div className={`coo-card coo-card--${c.prioridad.toLowerCase()}`} key={c.id}>
                  <CardDatos c={c} />
                  <div className="coo-card-fila">
                    <label className="coo-campo"><span>Fecha</span>
                      <input type="date" min={hoy()} value={fecha} onChange={(e) => cambiarSel(c.id, { fecha: e.target.value, medico_id: undefined, hora: undefined })} />
                    </label>
                    <label className="coo-campo"><span>Médico</span>
                      <select value={medico_id ?? 0} onChange={(e) => cambiarSel(c.id, { medico_id: Number(e.target.value) || undefined, hora: undefined })}>
                        <option value={0}>{opcMedicos.length ? "Seleccionar" : "Sin médicos ese día"}</option>
                        {opcMedicos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                      </select>
                    </label>
                    <label className="coo-campo"><span>Hora</span>
                      <select value={sel[c.id]?.hora ?? ""} disabled={!medico_id} onChange={(e) => cambiarSel(c.id, { hora: e.target.value })}>
                        <option value="">{medico_id && horas.length === 0 ? "Sin horas libres" : "Seleccionar"}</option>
                        {horas.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="coo-card-fila">
                    <button className="coo-btn coo-btn--solido" disabled={!medico_id || !sel[c.id]?.hora} onClick={() => aprobar(c)}>Aprobar y confirmar</button>
                    <button className="coo-btn coo-btn--peligro" onClick={() => rechazarCita(c.id)}>Rechazar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Confirmadas */}
        <section className="coo-col">
          <div className="coo-col-cab">
            <h2>Confirmadas<small>Citas aprobadas y en curso</small></h2>
            <span className="coo-contador">{confirmadas.length}</span>
          </div>
          <div className="coo-lista">
            {confirmadas.length === 0 && <p className="coo-vacio">Sin citas confirmadas.</p>}
            {confirmadas.map((c) => (
              <div className="coo-card" key={c.id}>
                <div className="coo-item" style={{ border: 0, padding: 0 }}>
                  <div className="coo-hora">{c.hora_inicio}</div>
                  <div className="coo-info" style={{ minWidth: 0 }}>
                    <h3>{nombreUsuario(db, c.paciente_id)}</h3>
                    <p>{nombreUsuario(db, c.medico_id)} · {c.modalidad}</p>
                    <p>{c.fecha}</p>
                  </div>
                  <span className={`coo-estado coo-estado--${claseEstado(c.estado)}`}>{c.estado}</span>
                </div>
                {c.estado === "Confirmada" && (
                  <div className="coo-card-fila">
                    <button className="coo-btn" onClick={() => reprogramarCita(c.id, c.fecha)}>Reasignar</button>
                    <button className="coo-btn coo-btn--peligro" onClick={() => cancelarCita(c.id)}>Cancelar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Historial */}
        <section className="coo-col coo-col--cerr">
          <div className="coo-col-cab">
            <h2>Cerradas<small>Atendidas, canceladas y rechazadas</small></h2>
            <span className="coo-contador">{cerradas.length}</span>
          </div>
          <div className="coo-lista">
            {cerradas.length === 0 && <p className="coo-vacio">Aún no hay citas cerradas.</p>}
            {cerradas.map((c) => (
              <div className="coo-card" key={c.id}>
                <div className="coo-item" style={{ border: 0, padding: 0 }}>
                  <div className="coo-info" style={{ minWidth: 0 }}>
                    <h3>{nombreUsuario(db, c.paciente_id)}</h3>
                    <p>{nombreEspecialidad(db, c.especialidad_id)} · {c.fecha}</p>
                  </div>
                  <span className={`coo-estado coo-estado--${claseEstado(c.estado)}`}>{c.estado}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Disponibilidad de hoy */}
      <section className="coo-tarjeta">
        <div className="coo-tarjeta-cab">
          <div>
            <h2>Disponibilidad de médicos (hoy)</h2>
            <p>Horas libres según su horario registrado.</p>
          </div>
        </div>
        <div className="coo-lista">
          {medicos.map((m) => {
            const libres = slotsLibres(db, m.id, hoy()).length;
            return (
              <div className="coo-item" key={m.id}>
                <div className="coo-info">
                  <h3>{m.nombre}</h3>
                  <p>{nombreEspecialidad(db, m.especialidad_id ?? 0)}</p>
                </div>
                <span className={`coo-estado ${libres ? "coo-estado--confirmada" : "coo-estado--cancelada"}`}>
                  {libres ? `${libres} horas libres` : "No disponible"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="coo-pie">
        <button className="coo-btn" onClick={() => { if (confirm("¿Restablecer los datos de prueba?")) resetDB(); }}>
          Restablecer datos de prueba
        </button>
      </div>
    </div>
  );
};

export default InicioCoordinador;