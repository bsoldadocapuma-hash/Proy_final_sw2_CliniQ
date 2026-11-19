import React from "react";
import { usuarioService } from "../../../../services/usuarioService";
import "./PerfilPersonal.css";

const GENERO: Record<string, string> = { M: "Masculino", F: "Femenino", O: "Otro" };

const mostrar = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "No especificado" : String(v);

const hora = (h: string) => h.slice(0, 5); // "08:00:00" -> "08:00"

export const PerfilMedicoModulo: React.FC = () => {
  const detalle = usuarioService.getUsuarioDetalle();

  if (!detalle) return <p className="pf-cargando">Cargando datos del médico...</p>;

  const u = detalle.usuario;
  const especialidades = detalle.especialidades ?? [];
  const horarios = detalle.horarios ?? [];

  return (
    <div className="pf-container">
      {/* ============ CABECERA ============ */}
      <div className="pf-header">
        <div className="pf-avatar">{u.nombre.charAt(0).toUpperCase()}</div>
        <div>
          <h2>{u.nombre}</h2>
          <p>Perfil profesional del médico</p>
        </div>
      </div>

      <div className="pf-grid">
        {/* ============ DATOS ============ */}
        <section className="pf-card pf-full">
          <h3>Datos del médico</h3>
          <p className="pf-sub">Información registrada en ClinIQ.</p>

          <div className="pf-datos">
            <div className="pf-dato"><span className="pf-label">Nombre completo</span><span className="pf-value">{mostrar(u.nombre)}</span></div>
            <div className="pf-dato"><span className="pf-label">Carnet de Identidad (CI)</span><span className="pf-value">{mostrar(u.ci)}</span></div>
            <div className="pf-dato"><span className="pf-label">Correo electrónico</span><span className="pf-value">{mostrar(u.email)}</span></div>
            <div className="pf-dato"><span className="pf-label">Matrícula profesional</span><span className="pf-value">{mostrar(u.matriculaProfesional)}</span></div>
            <div className="pf-dato"><span className="pf-label">Fecha de nacimiento</span><span className="pf-value">{mostrar(u.fechaNacimiento)}</span></div>
            <div className="pf-dato"><span className="pf-label">Género</span><span className="pf-value">{u.genero ? GENERO[u.genero] ?? u.genero : "No especificado"}</span></div>
            <div className="pf-dato"><span className="pf-label">Teléfono</span><span className="pf-value">{mostrar(u.telefono)}</span></div>
            <div className="pf-dato"><span className="pf-label">Dirección</span><span className="pf-value">{mostrar(u.direccion)}</span></div>
            <div className="pf-dato">
              <span className="pf-label">Disponibilidad</span>
              <span className={`pf-badge ${u.estadoDisponibilidad ? "on" : "off"}`}>
                {u.estadoDisponibilidad ? "Disponible" : "No disponible"}
              </span>
            </div>
            <div className="pf-dato">
              <span className="pf-label">Sala virtual</span>
              {u.linkSalaVirtual ? (
                <a className="pf-value" href={u.linkSalaVirtual} target="_blank" rel="noreferrer">
                  {u.linkSalaVirtual}
                </a>
              ) : (
                <span className="pf-value">No especificado</span>
              )}
            </div>
          </div>
        </section>

        {/* ============ ESPECIALIDADES ============ */}
        <section className="pf-card">
          <h3>Especialidades</h3>
          <p className="pf-sub">Áreas en las que atiende.</p>

          {especialidades.length === 0 ? (
            <p className="pf-vacio">Sin especialidades registradas.</p>
          ) : (
            <div className="pf-chips">
              {especialidades.map((e) => (
                <span key={e.id} className="pf-chip">{e.nombre}</span>
              ))}
            </div>
          )}
        </section>

        {/* ============ HORARIOS ============ */}
        <section className="pf-card">
          <h3>Horarios de atención</h3>
          <p className="pf-sub">Días y turnos asignados.</p>

          {horarios.length === 0 ? (
            <p className="pf-vacio">Sin horarios registrados.</p>
          ) : (
            <table className="pf-tabla">
              <thead>
                <tr><th>Día</th><th>Inicio</th><th>Fin</th><th>Turno</th></tr>
              </thead>
              <tbody>
                {horarios.map((h) => (
                  <tr key={h.id}>
                    <td>{h.dia}</td>
                    <td>{hora(h.horaInicio)}</td>
                    <td>{hora(h.horaFin)}</td>
                    <td>{h.tipoTurno ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
};

export default PerfilMedicoModulo;