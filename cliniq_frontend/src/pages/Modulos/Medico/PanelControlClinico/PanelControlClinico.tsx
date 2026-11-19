import React, { useState } from "react";
import "./PanelControlClinico.css";
import "../../ClinIQExtras.css";
import {
  useDB, usuarioActual, cambiarEstado, finalizarConsulta, hoy, DIAS,
  nombreUsuario, claseEstado, type DetalleReceta,
} from "../../clinicDb";

type MedForm = Omit<DetalleReceta, "id" | "receta_id">;
const medVacio = (): MedForm => ({ medicamento: "", dosis: "", frecuencia: "", duracion: "", via_administracion: "Oral" });

export const PanelControlClinico: React.FC = () => {
  const db = useDB();
  const yo = usuarioActual(db, "M");

  const [fecha, setFecha] = useState(hoy());
  const [finalizandoId, setFinalizandoId] = useState<number | null>(null);
  const [diagnostico, setDiagnostico] = useState("");
  const [indicacion, setIndicacion] = useState("");
  const [meds, setMeds] = useState<MedForm[]>([medVacio()]);
  const [error, setError] = useState("");

  // Agenda: citas que la coordinación asignó a este médico (relación "Atiende")
  const agenda = db.citas
    .filter((c) => c.medico_id === yo.id && c.fecha === fecha && ["Confirmada", "En curso", "Atendida"].includes(c.estado))
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  const horario = db.horarios
    .filter((h) => h.medico_id === yo.id)
    .sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia));
  const misPacientes = new Set(db.citas.filter((c) => c.medico_id === yo.id).map((c) => c.paciente_id));
  const alertas = db.alertas.filter((a) => misPacientes.has(a.paciente_id));

  const total = agenda.length;
  const virtuales = agenda.filter((c) => c.modalidad === "Virtual").length;
  const atendidas = agenda.filter((c) => c.estado === "Atendida").length;

  const abrirFinalizar = (id: number) => {
    setFinalizandoId(id); setDiagnostico(""); setIndicacion(""); setMeds([medVacio()]); setError("");
  };
  const setMed = (i: number, campo: keyof MedForm, valor: string) =>
    setMeds((prev) => prev.map((m, idx) => (idx === i ? { ...m, [campo]: valor } : m)));

  const guardar = (id: number) => {
    if (!diagnostico.trim()) return setError("Escribe el diagnóstico antes de finalizar.");
    finalizarConsulta(id, { diagnostico: diagnostico.trim(), indicacion: indicacion.trim(), medicamentos: meds });
    setFinalizandoId(null);
  };

  return (
    <div className="med-page">
      <header className="med-cabecera">
        <div className="med-avatar">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12h4l3-7 4 14 3-7h4" />
          </svg>
        </div>
        <div>
          <h1>Panel de Control Clínico</h1>
          <p>Tu agenda de hoy. Las citas las asigna la coordinación; la prioridad es una sugerencia del triaje y no un diagnóstico.</p>
        </div>
      </header>

      <div className="med-stats">
        <div className="med-stat"><span>Citas del día</span><strong>{total}</strong></div>
        <div className="med-stat"><span>Virtuales</span><strong>{virtuales}</strong></div>
        <div className="med-stat"><span>Atendidas</span><strong>{atendidas}</strong></div>
        <div className="med-stat"><span>Alertas de riesgo</span><strong>{alertas.length}</strong></div>
      </div>

      <div className="med-grid">
        <section className="med-tarjeta">
          <div className="med-tarjeta-cab" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2>{fecha === hoy() ? "Agenda de hoy" : "Agenda del " + fecha}</h2>
              <p>Pacientes asignados a tu horario.</p>
            </div>
            <label className="frm-campo"><span>Ver otro día</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value || hoy())} />
            </label>
          </div>

          <div className="med-lista">
            {agenda.length === 0 && <p style={{ margin: 0, color: "var(--suave)", fontSize: 14 }}>No tienes citas asignadas para este día.</p>}
            {agenda.map((c) => (
              <React.Fragment key={c.id}>
                <div className={`med-item${c.estado === "En curso" ? " med-item--activo" : ""}`}>
                  <div className="med-hora">{c.hora_inicio}</div>
                  <div className="med-info">
                    <h3>
                      {nombreUsuario(db, c.paciente_id)}
                      <span className={`med-prio med-prio--${c.prioridad.toLowerCase()}`}>Prioridad {c.prioridad}</span>
                    </h3>
                    <p>{c.motivo} · {c.modalidad}</p>
                  </div>
                  <div className="med-acciones">
                    {c.estado === "Confirmada" && (
                      <button className="med-btn med-btn--solido" onClick={() => cambiarEstado(c.id, "En curso")}>Iniciar consulta</button>
                    )}
                    {c.estado === "En curso" && (
                      <>
                        {c.modalidad === "Virtual" && c.link_google_meet && (
                          <a className="med-btn" href={c.link_google_meet} target="_blank" rel="noreferrer">Google Meet</a>
                        )}
                        <button className="med-btn med-btn--solido" onClick={() => abrirFinalizar(c.id)}>Finalizar y emitir receta</button>
                      </>
                    )}
                    {c.estado === "Atendida" && <span className={`med-estado med-estado--${claseEstado(c.estado)}`}>Atendida</span>}
                    <button className="med-btn">Ver expediente</button>
                  </div>
                </div>

                {finalizandoId === c.id && (
                  <div className="frm">
                    <label className="frm-campo frm-ancho"><span>Diagnóstico</span>
                      <textarea rows={2} value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
                    </label>
                    <label className="frm-campo frm-ancho"><span>Indicaciones generales</span>
                      <textarea rows={2} value={indicacion} onChange={(e) => setIndicacion(e.target.value)} />
                    </label>
                    {meds.map((m, i) => (
                      <div className="frm-fila" key={i}>
                        <label className="frm-campo"><span>Medicamento</span><input value={m.medicamento} onChange={(e) => setMed(i, "medicamento", e.target.value)} /></label>
                        <label className="frm-campo"><span>Dosis</span><input value={m.dosis} onChange={(e) => setMed(i, "dosis", e.target.value)} placeholder="500 mg" /></label>
                        <label className="frm-campo"><span>Frecuencia</span><input value={m.frecuencia} onChange={(e) => setMed(i, "frecuencia", e.target.value)} placeholder="Cada 8 h" /></label>
                        <label className="frm-campo"><span>Duración</span><input value={m.duracion} onChange={(e) => setMed(i, "duracion", e.target.value)} placeholder="5 días" /></label>
                      </div>
                    ))}
                    {error && <p className="frm-error">{error}</p>}
                    <div className="frm-acciones">
                      <button className="med-btn" onClick={() => setMeds((p) => [...p, medVacio()])}>+ Medicamento</button>
                      <button className="med-btn med-btn--solido" onClick={() => guardar(c.id)}>Guardar y finalizar</button>
                      <button className="med-btn" onClick={() => setFinalizandoId(null)}>Cancelar</button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        <div className="med-columna">
          <section className="med-tarjeta">
            <div className="med-tarjeta-cab"><div><h2>Mi horario semanal</h2><p>Disponibilidad registrada.</p></div></div>
            <div className="med-lista">
              {horario.length === 0 && <p style={{ margin: 0, color: "var(--suave)", fontSize: 14 }}>Sin horario registrado.</p>}
              {horario.map((h) => (
                <div className="med-dato" key={h.id}><span>{h.dia}</span><strong>{h.hora_inicio} – {h.hora_fin}</strong></div>
              ))}
            </div>
          </section>

          <section className="med-tarjeta">
            <div className="med-tarjeta-cab"><div><h2>Alertas de riesgo</h2><p>Apoyo a tu decisión clínica.</p></div></div>
            <div className="med-lista">
              {alertas.length === 0 && <p style={{ margin: 0, color: "var(--suave)", fontSize: 14 }}>Sin alertas.</p>}
              {alertas.map((a) => (
                <div className="med-item med-item--alerta" key={a.id}>
                  <div className="med-info">
                    <h3>{nombreUsuario(db, a.paciente_id)} <span className="med-prio med-prio--alta">Riesgo {a.nivel_riesgo.toLowerCase()}</span></h3>
                    <p>{a.patrones_detectados}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PanelControlClinico;