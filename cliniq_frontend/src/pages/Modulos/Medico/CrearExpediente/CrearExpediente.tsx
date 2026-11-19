import React, { useState } from "react";
import "./CrearExpediente.css";
import "../../ClinIQExtras.css";
import {
  useDB, usuarioActual, nombreUsuario, alergiasDe, conflictoAlergia,
  emitirExpediente, verificarEvidencia, type EvidenciaBlockchain,
} from "../../clinicDb";

type FilaMed = { medicamento_id: number; dosis: string; frecuencia: string; duracion: string; via_administracion: string };
type Verif = "..." | { hashOk: boolean; firmaOk: boolean };

const VIAS = ["Oral", "Tópica", "Intravenosa", "Intramuscular", "Subcutánea"];
const filaVacia = (): FilaMed => ({ medicamento_id: 0, dosis: "", frecuencia: "", duracion: "", via_administracion: "Oral" });
const corto = (h: string, a = 10, b = 6) => (h.length > a + b + 1 ? `${h.slice(0, a)}…${h.slice(-b)}` : h);

export const CrearExpediente: React.FC = () => {
  const db = useDB();
  const yo = usuarioActual(db, "M");

  // Se puede abrir desde el panel con  ...?cita=ID
  const [citaId, setCitaId] = useState(() => Number(new URLSearchParams(window.location.search).get("cita")) || 0);
  const [diagnostico, setDiagnostico] = useState("");
  const [indicacion, setIndicacion] = useState("");
  const [meds, setMeds] = useState<FilaMed[]>([filaVacia()]);
  const [confirmaAlergia, setConfirmaAlergia] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<EvidenciaBlockchain | null>(null);
  const [verif, setVerif] = useState<Record<number, Verif>>({});

  /* ── Paso 1: citas del médico listas para atender ── */
  const activas = db.citas
    .filter((c) => c.medico_id === yo.id && (c.estado === "Confirmada" || c.estado === "En curso"))
    .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio));
  const cita = activas.find((c) => c.id === citaId) ?? activas[0];

  /* ── Contexto clínico del paciente seleccionado ── */
  const pacienteId = cita?.paciente_id;
  const alergias = pacienteId ? alergiasDe(db, pacienteId) : [];
  const sintomas = cita
    ? db.cita_sintomas.filter((s) => s.cita_id === cita.id).map((s) => ({ ...s, nombre: db.sintomas.find((x) => x.id === s.sintoma_id)?.nombre ?? "" }))
    : [];
  const riesgo = db.alertas.find((a) => a.paciente_id === pacienteId);
  const historial = db.citas
    .filter((c) => c.paciente_id === pacienteId && c.id !== cita?.id)
    .flatMap((c) => db.diagnosticos.filter((d) => d.cita_id === c.id).map((d) => ({ ...d, fecha: c.fecha })))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  /* ── Paso 3: medicamentos (con control de alergias) ── */
  const medDe = (id: number) => db.medicamentos.find((m) => m.id === id);
  const etiquetaMed = (id: number) => { const m = medDe(id); return m ? `${m.nombre} ${m.concentracion}` : ""; };
  const conflictos = meds.map((f) => (f.medicamento_id ? conflictoAlergia(medDe(f.medicamento_id)!.nombre, alergias) : null));
  const hayConflicto = conflictos.some(Boolean);

  const setFila = (i: number, parcial: Partial<FilaMed>) =>
    setMeds((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...parcial } : f)));
  const elegirMed = (i: number, id: number) => {
    const m = medDe(id);
    setFila(i, { medicamento_id: id, dosis: m ? m.concentracion : "", via_administracion: m?.forma_farmaceutica === "Crema" ? "Tópica" : "Oral" });
    setConfirmaAlergia(false);
  };

  const puedeFirmar = !!cita && diagnostico.trim().length > 0 && !enviando && (!hayConflicto || confirmaAlergia);

  /* ── Paso 4: firmar y registrar ── */
  const firmar = async () => {
    if (!cita) return;
    setEnviando(true); setError("");
    try {
      const medicamentos = meds.filter((f) => f.medicamento_id).map((f) => ({
        medicamento_id: f.medicamento_id, medicamento: etiquetaMed(f.medicamento_id),
        dosis: f.dosis.trim(), frecuencia: f.frecuencia.trim(), duracion: f.duracion.trim(), via_administracion: f.via_administracion,
      }));
      const ev = await emitirExpediente(cita.id, { diagnostico, indicacion, medicamentos });
      setResultado(ev);
      setDiagnostico(""); setIndicacion(""); setMeds([filaVacia()]); setConfirmaAlergia(false); setCitaId(0);
    } catch (e) {
      setError("No se pudo firmar el expediente: " + (e instanceof Error ? e.message : "error desconocido"));
    } finally {
      setEnviando(false);
    }
  };

  const verificar = async (ev: EvidenciaBlockchain) => {
    setVerif((p) => ({ ...p, [ev.id]: "..." }));
    const r = await verificarEvidencia(db, ev);
    setVerif((p) => ({ ...p, [ev.id]: r }));
  };

  /* ── Expedientes ya emitidos por este médico ── */
  const emitidos = db.evidencias
    .filter((e) => db.citas.find((c) => c.id === e.cita_id)?.medico_id === yo.id)
    .sort((a, b) => b.id - a.id);

  const resumenReceta = (cita_id: number) => {
    const r = db.recetas.find((x) => x.cita_id === cita_id);
    return r ? db.detalles_receta.filter((d) => d.receta_id === r.id).map((d) => d.medicamento).join(", ") : "Sin receta";
  };
  const textoVerif = (v: Verif | undefined) => {
    if (!v) return null;
    if (v === "...") return <span className="exp-chip">Verificando…</span>;
    return v.hashOk && v.firmaOk
      ? <span className="exp-chip exp-chip--ok">✓ Íntegro y firma válida</span>
      : <span className="exp-chip exp-chip--mal">✗ {!v.hashOk ? "El contenido cambió" : "Firma inválida"}</span>;
  };

  return (
    <div className="exp-page">
      <header className="exp-cabecera">
        <div className="exp-avatar">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" />
          </svg>
        </div>
        <div>
          <h1>Crear Expediente</h1>
          <p>Registra el diagnóstico y la receta de la consulta. Al firmar, se genera la evidencia con hash y firma digital anclada en blockchain.</p>
        </div>
      </header>

      {resultado && (
        <section className="exp-ok" role="status">
          <h2>✓ Expediente firmado y registrado</h2>
          <dl>
            <dt>Hash del documento (SHA-256)</dt><dd>{resultado.hash_documento}</dd>
            <dt>Transacción en la red</dt><dd>{resultado.tx_hash_red}</dd>
            <dt>Firma digital (ECDSA)</dt><dd>{corto(resultado.firma, 24, 12)}</dd>
            <dt>Fecha y hora</dt><dd>{resultado.fecha} · {resultado.hora}</dd>
          </dl>
          <button className="med-btn" onClick={() => setResultado(null)}>Cerrar</button>
        </section>
      )}

      <div className="exp-grid">
        <div className="exp-columna">
          {/* Paso 1 */}
          <section className="exp-paso">
            <h2><span className="exp-num">1</span> Paciente y cita</h2>
            {activas.length === 0 ? (
              <p className="exp-vacio">No tienes citas confirmadas pendientes de atender.</p>
            ) : (
              <label className="frm-campo"><span>Cita a documentar</span>
                <select value={cita?.id ?? 0} onChange={(e) => { setCitaId(Number(e.target.value)); setConfirmaAlergia(false); }}>
                  {activas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {nombreUsuario(db, c.paciente_id)} · {c.fecha} {c.hora_inicio} · {c.modalidad}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </section>

          {cita && (
            <>
              {/* Paso 2 */}
              <section className="exp-paso">
                <h2><span className="exp-num">2</span> Diagnóstico</h2>
                <div className="frm" style={{ marginBottom: 0 }}>
                  <label className="frm-campo frm-ancho"><span>Diagnóstico</span>
                    <textarea rows={3} value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} placeholder="Diagnóstico clínico de la consulta" />
                  </label>
                  <label className="frm-campo frm-ancho"><span>Indicaciones al paciente</span>
                    <textarea rows={2} value={indicacion} onChange={(e) => setIndicacion(e.target.value)} placeholder="Reposo, dieta, controles, signos de alarma…" />
                  </label>
                </div>
              </section>

              {/* Paso 3 */}
              <section className="exp-paso">
                <h2><span className="exp-num">3</span> Medicamentos y receta</h2>
                {meds.map((f, i) => (
                  <div className="exp-med" key={i}>
                    <div className="frm-fila" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}>
                      <label className="frm-campo"><span>Medicamento</span>
                        <select value={f.medicamento_id} onChange={(e) => elegirMed(i, Number(e.target.value))}>
                          <option value={0}>Seleccionar</option>
                          {db.medicamentos.map((m) => <option key={m.id} value={m.id}>{m.nombre} {m.concentracion} ({m.forma_farmaceutica})</option>)}
                        </select>
                      </label>
                      <label className="frm-campo"><span>Dosis</span><input value={f.dosis} onChange={(e) => setFila(i, { dosis: e.target.value })} /></label>
                      <label className="frm-campo"><span>Frecuencia</span><input value={f.frecuencia} onChange={(e) => setFila(i, { frecuencia: e.target.value })} placeholder="Cada 8 h" /></label>
                      <label className="frm-campo"><span>Duración</span><input value={f.duracion} onChange={(e) => setFila(i, { duracion: e.target.value })} placeholder="5 días" /></label>
                      <label className="frm-campo"><span>Vía</span>
                        <select value={f.via_administracion} onChange={(e) => setFila(i, { via_administracion: e.target.value })}>
                          {VIAS.map((v) => <option key={v}>{v}</option>)}
                        </select>
                      </label>
                    </div>
                    {conflictos[i] && <p className="exp-alerta">⚠ El paciente tiene alergia registrada a <strong>{conflictos[i]}</strong>. Este medicamento puede estar contraindicado.</p>}
                    {meds.length > 1 && <button className="med-btn med-btn--peligro" onClick={() => setMeds((p) => p.filter((_, idx) => idx !== i))}>Quitar</button>}
                  </div>
                ))}
                <button className="med-btn" onClick={() => setMeds((p) => [...p, filaVacia()])}>+ Agregar medicamento</button>
                {hayConflicto && (
                  <label className="exp-check">
                    <input type="checkbox" checked={confirmaAlergia} onChange={(e) => setConfirmaAlergia(e.target.checked)} />
                    Revisé las alergias del paciente y asumo esta prescripción.
                  </label>
                )}
              </section>

              {/* Paso 4 */}
              <section className="exp-paso">
                <h2><span className="exp-num">4</span> Firma digital y blockchain</h2>
                <p className="exp-nota">
                  Se calcula el hash SHA-256 del expediente, se firma con tu clave y se registra como evidencia inmutable.
                  Después no se puede modificar sin que la verificación lo detecte.
                </p>
                {error && <p className="frm-aviso">{error}</p>}
                <button className="med-btn med-btn--solido" disabled={!puedeFirmar} onClick={firmar}>
                  {enviando ? "Firmando…" : "Firmar y registrar en blockchain"}
                </button>
              </section>
            </>
          )}
        </div>

        {/* Contexto del paciente */}
        <aside className="exp-lateral">
          <section className="exp-tarjeta">
            <h2>Contexto del paciente</h2>
            {!cita ? <p className="exp-vacio">Selecciona una cita.</p> : (
              <>
                <h3>{nombreUsuario(db, cita.paciente_id)}</h3>
                <p className="exp-sub">Motivo: {cita.motivo}</p>
                <p className="exp-sub">Triaje: Prioridad {cita.prioridad} (sugerencia, no diagnóstico)</p>

                <h4>Alergias</h4>
                {alergias.length ? alergias.map((a) => <span className="exp-chip exp-chip--mal" key={a}>{a}</span>) : <p className="exp-sub">Sin alergias registradas.</p>}

                <h4>Síntomas reportados</h4>
                {sintomas.length ? sintomas.map((s) => (
                  <p className="exp-sub" key={s.sintoma_id}><strong>{s.nombre}</strong> · {s.severidad}. {s.descripcion}</p>
                )) : <p className="exp-sub">Sin síntomas registrados.</p>}

                {riesgo && (<><h4>Alerta de riesgo</h4><p className="exp-sub">{riesgo.nivel_riesgo}: {riesgo.patrones_detectados}</p></>)}

                <h4>Historial de diagnósticos</h4>
                {historial.length ? historial.map((h) => (
                  <p className="exp-sub" key={h.id}><strong>{h.fecha}</strong> · {h.descripcion}</p>
                )) : <p className="exp-sub">Sin diagnósticos previos.</p>}
              </>
            )}
          </section>
        </aside>
      </div>

      {/* Expedientes emitidos */}
      <section className="exp-paso">
        <h2>Expedientes firmados</h2>
        {emitidos.length === 0 && <p className="exp-vacio">Aún no has firmado expedientes.</p>}
        {emitidos.map((ev) => {
          const c = db.citas.find((x) => x.id === ev.cita_id)!;
          return (
            <div className="exp-emitido" key={ev.id}>
              <div>
                <h3>{nombreUsuario(db, c.paciente_id)}</h3>
                <p className="exp-sub">{ev.fecha} · {ev.hora} · {resumenReceta(c.id)}</p>
                <p className="exp-sub">Hash: <code>{corto(ev.hash_documento)}</code> · Tx: <code>{corto(ev.tx_hash_red)}</code></p>
              </div>
              <div className="exp-emitido-acc">
                {textoVerif(verif[ev.id])}
                <button className="med-btn" onClick={() => verificar(ev)}>Verificar integridad</button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default CrearExpediente;