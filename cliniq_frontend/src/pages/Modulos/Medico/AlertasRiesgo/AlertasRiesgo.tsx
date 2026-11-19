import React, { useState } from "react";
import "./AlertasRiesgo.css";
import { useDB, usuarioActual, nombreUsuario, alergiasDe, marcarAlertaRevisada, hoy } from "../../clinicDb";

type Filtro = "Todos" | "Alto" | "Medio" | "Bajo";
const ORDEN = { Alto: 0, Medio: 1, Bajo: 2 } as const;
const pct = (n?: number) => (n === undefined ? "—" : `${Math.round(n * 100)}%`);

export const AlertasRiesgo: React.FC = () => {
  const db = useDB();
  const yo = usuarioActual(db, "M");

  const [nivel, setNivel] = useState<Filtro>("Todos");
  const [buscar, setBuscar] = useState("");
  const [verRevisadas, setVerRevisadas] = useState(false);
  const [abiertas, setAbiertas] = useState<Record<number, boolean>>({});

  // Solo pacientes que tienen o tuvieron citas con este médico
  const misPacientes = new Set(db.citas.filter((c) => c.medico_id === yo.id).map((c) => c.paciente_id));
  const propias = db.alertas.filter((a) => misPacientes.has(a.paciente_id));
  const pendientes = propias.filter((a) => !a.revisada);

  const visibles = propias
    .filter((a) => verRevisadas || !a.revisada)
    .filter((a) => nivel === "Todos" || a.nivel_riesgo === nivel)
    .filter((a) => nombreUsuario(db, a.paciente_id).toLowerCase().includes(buscar.trim().toLowerCase()))
    .sort((a, b) => ORDEN[a.nivel_riesgo] - ORDEN[b.nivel_riesgo] || (b.fecha + b.hora).localeCompare(a.fecha + a.hora));

  return (
    <div className="alr-page">
      <header className="alr-cabecera">
        <div className="alr-avatar">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3 2 20h20L12 3z" /><path d="M12 10v4M12 17.5v.01" />
          </svg>
        </div>
        <div>
          <h1>Alertas de Riesgo</h1>
          <p>Pacientes con patrones de riesgo detectados. Es un apoyo a tu decisión clínica, no un diagnóstico.</p>
        </div>
      </header>

      <div className="alr-stats">
        <div className="alr-stat"><span>Alertas pendientes</span><strong>{pendientes.length}</strong></div>
        <div className="alr-stat alr-stat--alto"><span>Riesgo alto</span><strong>{pendientes.filter((a) => a.nivel_riesgo === "Alto").length}</strong></div>
        <div className="alr-stat alr-stat--medio"><span>Riesgo medio</span><strong>{pendientes.filter((a) => a.nivel_riesgo === "Medio").length}</strong></div>
        <div className="alr-stat"><span>Riesgo bajo</span><strong>{pendientes.filter((a) => a.nivel_riesgo === "Bajo").length}</strong></div>
      </div>

      <section className="alr-tarjeta">
        <div className="alr-filtros">
          <label className="alr-campo"><span>Buscar paciente</span>
            <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Nombre del paciente" />
          </label>
          <label className="alr-campo"><span>Nivel de riesgo</span>
            <select value={nivel} onChange={(e) => setNivel(e.target.value as Filtro)}>
              <option>Todos</option><option>Alto</option><option>Medio</option><option>Bajo</option>
            </select>
          </label>
          <label className="alr-check">
            <input type="checkbox" checked={verRevisadas} onChange={(e) => setVerRevisadas(e.target.checked)} />
            Mostrar revisadas
          </label>
        </div>

        <div className="alr-lista">
          {visibles.length === 0 && <p className="alr-vacio">No hay alertas para mostrar.</p>}
          {visibles.map((a) => {
            const alergias = alergiasDe(db, a.paciente_id);
            const proxima = db.citas
              .filter((c) => c.medico_id === yo.id && c.paciente_id === a.paciente_id && c.estado === "Confirmada" && c.fecha >= hoy())
              .sort((x, y) => (x.fecha + x.hora_inicio).localeCompare(y.fecha + y.hora_inicio))[0];
            const matriz = Object.entries(a.matriz_probabilidades ?? {}).sort((x, y) => y[1] - x[1]);
            const clase = a.nivel_riesgo.toLowerCase();

            return (
              <article className={`alr-card alr-card--${clase}${a.revisada ? " alr-card--revisada" : ""}`} key={a.id}>
                <div className="alr-card-cab">
                  <div>
                    <h3>
                      {nombreUsuario(db, a.paciente_id)}
                      <span className={`alr-nivel alr-nivel--${clase}`}>Riesgo {clase}</span>
                      {a.revisada && <span className="alr-chip">Revisada</span>}
                    </h3>
                    <p className="alr-diag">{a.diagnostico_principal}</p>
                  </div>
                  <div className="alr-prob">
                    <strong>{pct(a.probabilidad_maxima)}</strong>
                    <span>probabilidad máx.</span>
                  </div>
                </div>

                <p className="alr-sub"><strong>Patrones detectados:</strong> {a.patrones_detectados}</p>
                <p className="alr-sub">
                  <strong>Detectada:</strong> {a.fecha} · {a.hora}
                  {proxima && <> &nbsp;|&nbsp; <strong>Próxima cita:</strong> {proxima.fecha} {proxima.hora_inicio}</>}
                </p>
                {alergias.length > 0 && (
                  <p className="alr-sub"><strong>Alergias:</strong> {alergias.map((x) => <span className="alr-chip alr-chip--mal" key={x}>{x}</span>)}</p>
                )}

                {abiertas[a.id] && (
                  <div className="alr-matriz">
                    <h4>Matriz de probabilidades</h4>
                    {matriz.length === 0 && <p className="alr-sub">Sin datos de probabilidades.</p>}
                    {matriz.map(([categoria, p]) => (
                      <div className="alr-barra" key={categoria}>
                        <span>{categoria}</span>
                        <div className="alr-barra-fondo"><div className={`alr-barra-valor alr-barra-valor--${clase}`} style={{ width: `${Math.round(p * 100)}%` }} /></div>
                        <strong>{pct(p)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                <div className="alr-acciones">
                  <button className="alr-btn" onClick={() => setAbiertas((p) => ({ ...p, [a.id]: !p[a.id] }))}>
                    {abiertas[a.id] ? "Ocultar detalle" : "Ver matriz de probabilidades"}
                  </button>
                  <button className="alr-btn">Ver expediente</button>
                  <button className="alr-btn alr-btn--solido" onClick={() => marcarAlertaRevisada(a.id, !a.revisada)}>
                    {a.revisada ? "Marcar como pendiente" : "Marcar como revisada"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AlertasRiesgo;