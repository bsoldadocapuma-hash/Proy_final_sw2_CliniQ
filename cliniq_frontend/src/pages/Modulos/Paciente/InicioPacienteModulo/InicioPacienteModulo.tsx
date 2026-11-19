import React, { useState } from "react";
import "./InicioPacienteModulo.css";
import "../../ClinIQExtras.css";
import {
  useDB, usuarioActual, crearCita, cancelarCita, reprogramarCita, hoy,
  nombreUsuario, nombreEspecialidad, claseEstado, type Modalidad,
} from "../../clinicDb";

export const InicioPacienteModulo: React.FC = () => {
  const db = useDB();
  const yo = usuarioActual(db, "P");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ especialidad_id: 0, fecha: "", modalidad: "Presencial" as Modalidad, motivo: "" });
  const [error, setError] = useState("");
  const [reprogId, setReprogId] = useState<number | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");

  // Mis citas (relación "Solicita"), ordenadas por fecha y hora
  const mias = db.citas
    .filter((c) => c.paciente_id === yo.id)
    .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio));
  const proxima = mias.find((c) => c.estado === "Confirmada" && c.fecha >= hoy());
  const confirmadas = mias.filter((c) => c.estado === "Confirmada").length;
  const pendientes = mias.filter((c) => c.estado === "Solicitada").length;

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const especialidad_id = form.especialidad_id || db.especialidades[0].id;
    if (!form.fecha || !form.motivo.trim()) return setError("Indica la fecha y el motivo de la consulta.");
    crearCita({ paciente_id: yo.id, especialidad_id, fecha: form.fecha, modalidad: form.modalidad, motivo: form.motivo.trim() });
    setForm({ especialidad_id: 0, fecha: "", modalidad: "Presencial", motivo: "" });
    setError("");
    setMostrarForm(false);
  };

  const confirmarReprog = (id: number) => {
    if (!nuevaFecha) return;
    reprogramarCita(id, nuevaFecha);
    setReprogId(null);
    setNuevaFecha("");
  };

  const FormReprog = ({ id }: { id: number }) =>
    reprogId === id ? (
      <div className="frm-inline">
        <label className="frm-campo"><span>Nueva fecha</span>
          <input type="date" min={hoy()} value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
        </label>
        <button className="pac-btn pac-btn--solido" disabled={!nuevaFecha} onClick={() => confirmarReprog(id)}>Solicitar reprogramación</button>
        <button className="pac-btn" onClick={() => setReprogId(null)}>Cerrar</button>
      </div>
    ) : null;

  return (
    <div className="pac-page">
      <header className="pac-cabecera">
        <div className="pac-avatar">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
        </div>
        <div>
          <h1>Mis Citas</h1>
          <p>Revisa tus próximas atenciones. La coordinación confirma cada solicitud y te asigna médico y horario.</p>
        </div>
      </header>

      <section className="pac-tarjeta">
        <div className="pac-tarjeta-cab">
          <div>
            <h2>Próxima cita</h2>
            <p>Tu siguiente atención confirmada.</p>
          </div>
          <button className="pac-btn" onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cerrar" : "+ Reservar cita"}
          </button>
        </div>

        {mostrarForm && (
          <form className="frm" onSubmit={enviar}>
            <label className="frm-campo"><span>Especialidad</span>
              <select value={form.especialidad_id || db.especialidades[0].id} onChange={(e) => setForm({ ...form, especialidad_id: Number(e.target.value) })}>
                {db.especialidades.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </label>
            <label className="frm-campo"><span>Fecha deseada</span>
              <input type="date" min={hoy()} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </label>
            <label className="frm-campo"><span>Modalidad</span>
              <select value={form.modalidad} onChange={(e) => setForm({ ...form, modalidad: e.target.value as Modalidad })}>
                <option>Presencial</option><option>Virtual</option>
              </select>
            </label>
            <label className="frm-campo frm-ancho"><span>Motivo de la consulta</span>
              <textarea rows={2} value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Describe brevemente tus síntomas o motivo" />
            </label>
            {error && <p className="frm-error">{error}</p>}
            <div className="frm-acciones">
              <button type="submit" className="pac-btn pac-btn--solido">Enviar solicitud</button>
            </div>
          </form>
        )}

        {proxima ? (
          <>
            <div className="pac-item pac-item--destacado">
              <div className="pac-fecha">
                <strong>{proxima.fecha.slice(8)}</strong>
                <span>{proxima.hora_inicio}</span>
              </div>
              <div className="pac-info">
                <h3>{nombreUsuario(db, proxima.medico_id)} <span className="pac-badge">{proxima.modalidad}</span></h3>
                <p>{nombreEspecialidad(db, proxima.especialidad_id)} · {proxima.fecha}</p>
              </div>
              <div className="pac-acciones">
                {proxima.modalidad === "Virtual" && proxima.link_google_meet && (
                  <a className="pac-btn pac-btn--solido" href={proxima.link_google_meet} target="_blank" rel="noreferrer">Unirse a Google Meet</a>
                )}
                <button className="pac-btn" onClick={() => { setReprogId(proxima.id); setNuevaFecha(""); }}>Reprogramar</button>
              </div>
            </div>
            <FormReprog id={proxima.id} />
          </>
        ) : (
          <p className="pac-vacio">No tienes citas confirmadas. Reserva una para empezar.</p>
        )}
      </section>

      <div className="pac-grid">
        <section className="pac-tarjeta">
          <div className="pac-tarjeta-cab">
            <div>
              <h2>Todas mis citas</h2>
              <p>Estado de cada solicitud.</p>
            </div>
          </div>
          <div className="pac-lista">
            {mias.length === 0 && <p className="pac-vacio">Aún no tienes citas registradas.</p>}
            {mias.map((c) => {
              const abierta = c.estado === "Solicitada" || c.estado === "Confirmada";
              return (
                <React.Fragment key={c.id}>
                  <div className="pac-item">
                    <div className="pac-info">
                      <h3>{nombreEspecialidad(db, c.especialidad_id)}</h3>
                      <p>{nombreUsuario(db, c.medico_id)} · {c.fecha} · {c.hora_inicio || "Por asignar"}</p>
                      <p>{c.modalidad} · {c.motivo}</p>
                    </div>
                    <span className={`pac-estado pac-estado--${claseEstado(c.estado)}`}>{c.estado}</span>
                    {abierta && <button className="pac-btn" onClick={() => { setReprogId(c.id); setNuevaFecha(""); }}>Reprogramar</button>}
                    {abierta && <button className="pac-btn pac-btn--peligro" onClick={() => cancelarCita(c.id)}>Cancelar</button>}
                  </div>
                  {c.id !== proxima?.id && <FormReprog id={c.id} />}
                </React.Fragment>
              );
            })}
          </div>
        </section>

        <section className="pac-tarjeta">
          <div className="pac-tarjeta-cab">
            <div>
              <h2>Resumen</h2>
              <p>Tu actividad de citas.</p>
            </div>
          </div>
          <div className="pac-resumen">
            <div className="pac-dato"><span>Confirmadas</span><strong>{confirmadas}</strong></div>
            <div className="pac-dato"><span>Esperando confirmación</span><strong>{pendientes}</strong></div>
            <div className="pac-dato"><span>Total registradas</span><strong>{mias.length}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InicioPacienteModulo;