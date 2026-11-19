import React, { useState, useEffect, useMemo } from "react";
import {
  usuarioService,
  type Usuario,
  type Catalogo,
  type Seguro,
} from "../../../../services/usuarioService";
import "./PerfilPacienteModulo.css";

/* ================= ICONOS GEOMÉTRICOS ================= */
const DOT = "#357e65";
const LINE = "#357e65";
const GUIDE = "#9cc7b7";

const IconHex: React.FC = () => (
  <svg className="card-icon" viewBox="0 0 64 64" fill="none">
    <polygon points="32,5 55,18.5 55,45.5 32,59 9,45.5 9,18.5" stroke={LINE} strokeWidth="1" />
    <polygon points="32,20 44,27 44,41 32,48 20,41 20,27" stroke={LINE} strokeWidth="1" />
    <path d="M32 5V59M9 18.5L55 45.5M55 18.5L9 45.5" stroke={GUIDE} strokeWidth="1" strokeDasharray="1 3" />
    {[[32,5],[55,18.5],[55,45.5],[32,59],[9,45.5],[9,18.5],[32,32]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="1.6" fill={DOT} />
    ))}
  </svg>
);

const IconAtom: React.FC = () => (
  <svg className="card-icon" viewBox="0 0 64 64" fill="none">
    {[0, 60, 120].map((deg) => (
      <ellipse key={deg} cx="32" cy="32" rx="27" ry="10" stroke={LINE} strokeWidth="1" transform={`rotate(${deg} 32 32)`} />
    ))}
    <path d="M32 6V58M6 32H58" stroke={GUIDE} strokeWidth="1" strokeDasharray="1 3" />
    <circle cx="32" cy="32" r="2" fill={DOT} />
    <circle cx="32" cy="6" r="1.6" fill={DOT} />
    <circle cx="32" cy="58" r="1.6" fill={DOT} />
  </svg>
);

const IconDiamonds: React.FC = () => (
  <svg className="card-icon" viewBox="0 0 64 64" fill="none">
    <polygon points="32,4 46,18 32,32 18,18" stroke={LINE} strokeWidth="1" />
    <polygon points="18,24 32,38 18,52 4,38" stroke={LINE} strokeWidth="1" />
    <polygon points="46,24 60,38 46,52 32,38" stroke={LINE} strokeWidth="1" />
    <polygon points="32,32 46,46 32,60 18,46" stroke={LINE} strokeWidth="1" />
    <path d="M32 4V60M4 38H60" stroke={GUIDE} strokeWidth="1" strokeDasharray="1 3" />
    {[[32,4],[32,32],[18,18],[46,18],[4,38],[60,38],[32,60],[32,38]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="1.6" fill={DOT} />
    ))}
  </svg>
);

const mostrar = (v: string | number | null | undefined, sufijo = "") =>
  v === null || v === undefined || v === "" ? "No especificado" : `${v}${sufijo}`;

/* ================= COMPONENTE ================= */
export const PerfilPacienteModulo: React.FC = () => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ---- Perfil ----
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [datosEditables, setDatosEditables] = useState({
    telefono: "",
    direccion: "",
    grupoSanguineo: "",
    contactoEmergencia: "",
    pesoKg: "",
    alturaCm: "",
  });

  // ---- Alergias ----
  const [alergiasUsuario, setAlergiasUsuario] = useState<Catalogo[]>([]);
  const [catalogoAlergias, setCatalogoAlergias] = useState<Catalogo[]>([]);
  const [busqueda, setBusqueda] = useState("");

  // ---- Seguros ----
  const [segurosList, setSegurosList] = useState<Seguro[]>([]);
  const [mostrarFormSeguro, setMostrarFormSeguro] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [nombreAseguradora, setNombreAseguradora] = useState("");
  const [numeroPoliza, setNumeroPoliza] = useState("");
  const [tipoCobertura, setTipoCobertura] = useState("");
  const [porcentajeCobertura, setPorcentajeCobertura] = useState("");
  const [copago, setCopago] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [esPrincipal, setEsPrincipal] = useState(true);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const msg = (e: unknown, porDefecto: string) =>
    setError(e instanceof Error && e.message ? e.message : porDefecto);

  const cargarDatosIniciales = async () => {
    const currentUser = usuarioService.getCurrentUser();
    if (!currentUser) return;

    setUser(currentUser);
    setDatosEditables({
      telefono: currentUser.telefono?.toString() ?? "",
      direccion: currentUser.direccion ?? "",
      grupoSanguineo: currentUser.grupoSanguineo ?? "",
      contactoEmergencia: currentUser.contactoEmergencia?.toString() ?? "",
      pesoKg: currentUser.pesoKg?.toString() ?? "",
      alturaCm: currentUser.alturaCm?.toString() ?? "",
    });

    try {
      const [misAlergias, catalogo, seguros] = await Promise.all([
        usuarioService.obtenerAlergiasDePaciente(currentUser.id),
        usuarioService.listarAlergias(),
        usuarioService.listarSeguros(currentUser.id),
      ]);
      setAlergiasUsuario(misAlergias);
      setCatalogoAlergias(catalogo);
      setSegurosList(seguros);
    } catch (e) {
      msg(e, "Error al cargar los datos del perfil");
    }
  };

  // ================= PERFIL =================
  const handleGuardarPerfil = async () => {
    if (!user) return;
    setError(null);
    try {
      const res = await usuarioService.modificarPerfilPaciente(user.id, {
        telefono: datosEditables.telefono ? Number(datosEditables.telefono) : undefined,
        direccion: datosEditables.direccion || undefined,
        grupoSanguineo: datosEditables.grupoSanguineo || undefined,
        contactoEmergencia: datosEditables.contactoEmergencia
          ? Number(datosEditables.contactoEmergencia)
          : undefined,
        pesoKg: datosEditables.pesoKg ? Number(datosEditables.pesoKg) : undefined,
        alturaCm: datosEditables.alturaCm ? Number(datosEditables.alturaCm) : undefined,
      });
      setUser(res.usuario); // el service ya actualizó el localStorage
      setEditandoPerfil(false);
    } catch (e) {
      msg(e, "Error al actualizar el perfil");
    }
  };

  // ================= ALERGIAS =================
  const idsAsignadas = useMemo(() => new Set(alergiasUsuario.map((a) => a.id)), [alergiasUsuario]);

  const termino = busqueda.trim();

  // Alergias del catálogo que coinciden con la búsqueda y aún no tiene el paciente
  const sugerencias = useMemo(() => {
    if (!termino) return [];
    const t = termino.toLowerCase();
    return catalogoAlergias.filter(
      (a) => !idsAsignadas.has(a.id) && a.nombre.toLowerCase().includes(t)
    );
  }, [termino, catalogoAlergias, idsAsignadas]);

  const existeExacta = catalogoAlergias.some(
    (a) => a.nombre.toLowerCase() === termino.toLowerCase()
  );

  const handleAsignarAlergia = async (alergia: Catalogo) => {
    if (!user) return;
    setError(null);
    try {
      const asignada = await usuarioService.agregarAlergiaAPaciente(user.id, alergia.id);
      setAlergiasUsuario((prev) => [...prev, asignada]);
      setBusqueda("");
    } catch (e) {
      msg(e, "Error al asignar la alergia");
    }
  };

  // Crea la alergia en el catálogo y la asigna al paciente
  const handleCrearYAsignar = async () => {
    if (!user || !termino) return;
    setError(null);
    try {
      const nueva = await usuarioService.crearAlergia({ nombre: termino });
      setCatalogoAlergias((prev) => [...prev, nueva]);
      const asignada = await usuarioService.agregarAlergiaAPaciente(user.id, nueva.id);
      setAlergiasUsuario((prev) => [...prev, asignada]);
      setBusqueda("");
    } catch (e) {
      msg(e, "Error al crear la alergia");
    }
  };

  // Quita la alergia SOLO del paciente (no la borra del catálogo)
  const handleQuitarAlergia = async (idAlergia: number) => {
    if (!user) return;
    setError(null);
    try {
      await usuarioService.quitarAlergiaDePaciente(user.id, idAlergia);
      setAlergiasUsuario((prev) => prev.filter((a) => a.id !== idAlergia));
    } catch (e) {
      msg(e, "Error al quitar la alergia");
    }
  };

  // ================= SEGUROS =================
  const handleGuardarSeguro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    try {
      await usuarioService.registrarSeguro(user.id, {
        nombreAseguradora,
        numeroPoliza,
        tipoCobertura: tipoCobertura || undefined,
        porcentajeCobertura: porcentajeCobertura ? Number(porcentajeCobertura) : undefined,
        copago: copago ? Number(copago) : undefined,
        fechaInicioVigencia: fechaInicio,
        fechaFinVigencia: fechaFin,
        esPrincipal,
      });

      // Recarga: el backend desmarca los demás si el nuevo es principal
      setSegurosList(await usuarioService.listarSeguros(user.id));

      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);

      setNombreAseguradora("");
      setNumeroPoliza("");
      setTipoCobertura("");
      setPorcentajeCobertura("");
      setCopago("");
      setFechaInicio("");
      setFechaFin("");
      setEsPrincipal(true);
      setMostrarFormSeguro(false);
    } catch (e) {
      msg(e, "Error al registrar el seguro");
    }
  };

  const handleEliminarSeguro = async (idSeguro: number) => {
    if (!user) return;
    setError(null);
    try {
      await usuarioService.eliminarSeguro(user.id, idSeguro);
      setSegurosList((prev) => prev.filter((s) => s.id !== idSeguro));
    } catch (e) {
      msg(e, "Error al eliminar el seguro");
    }
  };

  if (!user) return <p className="perfil-cargando">Cargando datos del paciente...</p>;

  return (
    <div className="perfil-paciente-container-full">
      {/* ============ CABECERA ============ */}
      <div className="perfil-header">
        <div className="avatar-anonimo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <h2>Mi Expediente y Perfil</h2>
          <p>Administra tu información personal, alergias y pólizas de seguro médico.</p>
        </div>
      </div>

      {error && (
        <div className="perfil-error" onClick={() => setError(null)}>
          {error} <span>(clic para cerrar)</span>
        </div>
      )}

      <div className="perfil-grid-completo">
        {/* ============ 1. DATOS DEL PACIENTE (ancho completo) ============ */}
        <section className="perfil-card card-full">
          <div className="card-head">
            <IconHex />
            <div className="card-head-text">
              <h3>Datos del paciente</h3>
              <p>Tu identidad, contacto y datos de salud registrados en ClinIQ.</p>
            </div>
            {!editandoPerfil && (
              <button className="btn-outline-small" onClick={() => setEditandoPerfil(true)}>
                Editar
              </button>
            )}
          </div>

          {editandoPerfil ? (
            <div className="edicion-form">
              <div className="datos-grid">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="number" className="perfil-input" value={datosEditables.telefono}
                    onChange={(e) => setDatosEditables({ ...datosEditables, telefono: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <input type="text" className="perfil-input" value={datosEditables.direccion}
                    onChange={(e) => setDatosEditables({ ...datosEditables, direccion: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Grupo sanguíneo</label>
                  <input type="text" className="perfil-input" placeholder="Ej: O+" value={datosEditables.grupoSanguineo}
                    onChange={(e) => setDatosEditables({ ...datosEditables, grupoSanguineo: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Contacto de emergencia</label>
                  <input type="number" className="perfil-input" value={datosEditables.contactoEmergencia}
                    onChange={(e) => setDatosEditables({ ...datosEditables, contactoEmergencia: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Peso (kg)</label>
                  <input type="number" step="0.1" className="perfil-input" value={datosEditables.pesoKg}
                    onChange={(e) => setDatosEditables({ ...datosEditables, pesoKg: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Altura (cm)</label>
                  <input type="number" className="perfil-input" value={datosEditables.alturaCm}
                    onChange={(e) => setDatosEditables({ ...datosEditables, alturaCm: e.target.value })} />
                </div>
              </div>
              <div className="botones-flex">
                <button className="btn-guardar-perfil" onClick={handleGuardarPerfil}>Guardar cambios</button>
                <button className="btn-cancelar" onClick={() => setEditandoPerfil(false)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="datos-grid">
              <div className="dato-item"><span className="label">Nombre completo</span><span className="value">{mostrar(user.nombre)}</span></div>
              <div className="dato-item"><span className="label">Carnet de Identidad (CI)</span><span className="value">{mostrar(user.ci)}</span></div>
              <div className="dato-item"><span className="label">Correo electrónico</span><span className="value">{mostrar(user.email)}</span></div>
              <div className="dato-item"><span className="label">Fecha de nacimiento</span><span className="value">{mostrar(user.fechaNacimiento)}</span></div>
              <div className="dato-item"><span className="label">Género</span><span className="value">{mostrar(user.genero)}</span></div>
              <div className="dato-item"><span className="label">Teléfono</span><span className="value">{mostrar(user.telefono)}</span></div>
              <div className="dato-item"><span className="label">Dirección</span><span className="value">{mostrar(user.direccion)}</span></div>
              <div className="dato-item"><span className="label">Grupo sanguíneo</span><span className="value">{mostrar(user.grupoSanguineo)}</span></div>
              <div className="dato-item"><span className="label">Contacto de emergencia</span><span className="value">{mostrar(user.contactoEmergencia)}</span></div>
              <div className="dato-item"><span className="label">Peso</span><span className="value">{mostrar(user.pesoKg, " kg")}</span></div>
              <div className="dato-item"><span className="label">Altura</span><span className="value">{mostrar(user.alturaCm, " cm")}</span></div>
            </div>
          )}
        </section>

        {/* ============ 2. ALERGIAS (izquierda) ============ */}
        <section className="perfil-card">
          <div className="card-head">
            <IconAtom />
            <div className="card-head-text">
              <h3>Alergias conocidas</h3>
              <p>Busca una alergia para asignarla, o créala si no existe.</p>
            </div>
          </div>

          <div className="lista-items">
            {alergiasUsuario.length === 0 && <p className="text-muted">No se han registrado alergias.</p>}
            {alergiasUsuario.map((alergia) => (
              <div key={alergia.id} className="item-fila">
                <span>{alergia.nombre}</span>
                <button className="btn-delete" onClick={() => handleQuitarAlergia(alergia.id)}>Quitar</button>
              </div>
            ))}
          </div>

          <div className="buscador-alergias mt-3">
            <input
              type="text"
              className="perfil-input"
              placeholder="Buscar alergia (ej. Penicilina)"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            {termino && (
              <div className="sugerencias">
                {sugerencias.map((a) => (
                  <button key={a.id} type="button" className="sugerencia-item" onClick={() => handleAsignarAlergia(a)}>
                    + {a.nombre}
                  </button>
                ))}

                {!existeExacta && (
                  <button type="button" className="sugerencia-item sugerencia-crear" onClick={handleCrearYAsignar}>
                    Crear «{termino}» y asignarla
                  </button>
                )}

                {sugerencias.length === 0 && existeExacta && (
                  <p className="text-muted sugerencia-vacia">Esa alergia ya está en tu lista.</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ============ 3. SEGUROS (derecha) ============ */}
        <section className="perfil-card">
          <div className="card-head">
            <IconDiamonds />
            <div className="card-head-text">
              <h3>Mis seguros médicos</h3>
              <p>Pólizas registradas y seguro principal.</p>
            </div>
            <button className="btn-outline-small" onClick={() => setMostrarFormSeguro((v) => !v)}>
              {mostrarFormSeguro ? "Cerrar" : "+ Agregar"}
            </button>
          </div>

          <div className="lista-items">
            {segurosList.length === 0 && <p className="text-muted">No tienes seguros registrados.</p>}
            {segurosList.map((s) => (
              <div key={s.id} className={`item-fila ${s.esPrincipal ? "principal" : ""}`}>
                <div>
                  <strong>{s.nombreAseguradora}</strong>
                  {s.esPrincipal && <span className="badge">Principal</span>}
                  <br />
                  <span className="poliza-text">Póliza: {s.numeroPoliza}</span>
                  <br />
                  <span className="poliza-text">
                    Vigencia: {s.fechaInicioVigencia} a {s.fechaFinVigencia}
                  </span>
                  {(s.tipoCobertura || s.porcentajeCobertura !== null) && (
                    <>
                      <br />
                      <span className="poliza-text">
                        {s.tipoCobertura ?? ""}
                        {s.porcentajeCobertura !== null ? ` · ${s.porcentajeCobertura}% cobertura` : ""}
                        {s.copago !== null ? ` · Copago ${s.copago}` : ""}
                      </span>
                    </>
                  )}
                </div>
                <div className="botones-accion-seguro">
                  <button onClick={() => handleEliminarSeguro(s.id)} className="btn-delete">Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          {guardado && <p className="text-success mt-2">¡Seguro registrado exitosamente!</p>}

          {mostrarFormSeguro && (
            <form onSubmit={handleGuardarSeguro} className="form-poliza mt-3">
              <div className="form-group">
                <label>Aseguradora</label>
                <input type="text" placeholder="Ej. Alianza, BISA" value={nombreAseguradora}
                  onChange={(e) => setNombreAseguradora(e.target.value)} required className="perfil-input" />
              </div>
              <div className="form-group">
                <label>Número de póliza</label>
                <input type="text" placeholder="Ej. POL-98765432" value={numeroPoliza}
                  onChange={(e) => setNumeroPoliza(e.target.value)} required className="perfil-input" />
              </div>
              <div className="form-group span-2">
                <label>Tipo de cobertura</label>
                <input type="text" placeholder="Ej. Completa, Hospitalaria" value={tipoCobertura}
                  onChange={(e) => setTipoCobertura(e.target.value)} className="perfil-input" />
              </div>
              <div className="form-group">
                <label>% Cobertura</label>
                <input type="number" step="0.1" placeholder="80" value={porcentajeCobertura}
                  onChange={(e) => setPorcentajeCobertura(e.target.value)} className="perfil-input" />
              </div>
              <div className="form-group">
                <label>Copago ($ / Bs)</label>
                <input type="number" step="0.1" placeholder="50" value={copago}
                  onChange={(e) => setCopago(e.target.value)} className="perfil-input" />
              </div>
              <div className="form-group">
                <label>Inicio vigencia</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required className="perfil-input" />
              </div>
              <div className="form-group">
                <label>Fin vigencia</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required className="perfil-input" />
              </div>

              <div className="form-group checkbox-group span-2">
                <label>
                  <input type="checkbox" checked={esPrincipal} onChange={(e) => setEsPrincipal(e.target.checked)} />
                  Marcar como seguro principal
                </label>
              </div>

              <div className="span-2">
                <button type="submit" className="btn-guardar-perfil">Guardar seguro médico</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default PerfilPacienteModulo;