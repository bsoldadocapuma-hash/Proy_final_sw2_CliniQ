import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  usuarioService,
  ApiError,
  type UsuarioDetalle,
  type Catalogo,
  type HorarioPayload,
  type RegisterPacientePayload,
  type RegisterMedicoPayload,
} from "../../../../services/usuarioService"; // ajusta la ruta si tu carpeta es distinta
import "./GestionUsuarios.css";

// =====================================================
// CONSTANTES Y HELPERS
// =====================================================
type Rol = "P" | "M" | "C";

const ROLES: Record<Rol, string> = { P: "Paciente", M: "Médico", C: "Coordinador" };
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const TURNOS = ["Mañana", "Tarde", "Noche", "Completo"];
const GRUPOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const calcularEdad = (fecha: string | null): number | null => {
  if (!fecha) return null;
  const [y, m, d] = fecha.split("-").map(Number);
  if (!y || !m || !d) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - y;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) edad--;
  return edad < 0 ? null : edad;
};

const num = (v: string): number | undefined => (v.trim() === "" ? undefined : Number(v));
const txt = (v: string): string | undefined => (v.trim() === "" ? undefined : v.trim());
const errMsg = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : "Ocurrió un error inesperado.");

// =====================================================
// FORMULARIO
// =====================================================
interface FormState {
  ci: string;
  email: string;
  password: string;
  nombre: string;
  fechaNacimiento: string;
  telefono: string;
  genero: string;
  direccion: string;
  grupoSanguineo: string;
  contactoEmergencia: string;
  pesoKg: string;
  alturaCm: string;
  matriculaProfesional: string;
  linkSalaVirtual: string;
  estadoDisponibilidad: boolean;
  especialidadIds: number[];
  horarios: HorarioPayload[];
}

const emptyForm = (): FormState => ({
  ci: "", email: "", password: "", nombre: "", fechaNacimiento: "",
  telefono: "", genero: "", direccion: "", grupoSanguineo: "",
  contactoEmergencia: "", pesoKg: "", alturaCm: "",
  matriculaProfesional: "", linkSalaVirtual: "", estadoDisponibilidad: true,
  especialidadIds: [], horarios: [],
});

const fromDetalle = (d: UsuarioDetalle): FormState => {
  const u = d.usuario;
  return {
    ci: String(u.ci),
    email: u.email,
    password: "",
    nombre: u.nombre,
    fechaNacimiento: u.fechaNacimiento ?? "",
    telefono: u.telefono?.toString() ?? "",
    genero: u.genero ?? "",
    direccion: u.direccion ?? "",
    grupoSanguineo: u.grupoSanguineo ?? "",
    contactoEmergencia: u.contactoEmergencia?.toString() ?? "",
    pesoKg: u.pesoKg?.toString() ?? "",
    alturaCm: u.alturaCm?.toString() ?? "",
    matriculaProfesional: u.matriculaProfesional ?? "",
    linkSalaVirtual: u.linkSalaVirtual ?? "",
    estadoDisponibilidad: u.estadoDisponibilidad ?? true,
    especialidadIds: (d.especialidades ?? []).map((e) => e.id),
    horarios: (d.horarios ?? []).map((h) => ({
      dia: h.dia,
      horaInicio: h.horaInicio.slice(0, 5),
      horaFin: h.horaFin.slice(0, 5),
      tipoTurno: h.tipoTurno ?? undefined,
    })),
  };
};

const Field: React.FC<{ label: string; full?: boolean; children: React.ReactNode }> = ({ label, full, children }) => (
  <label className={`gu-field${full ? " gu-field--full" : ""}`}>
    <span>{label}</span>
    {children}
  </label>
);

const HorariosEditor: React.FC<{
  value: HorarioPayload[];
  onChange: (v: HorarioPayload[]) => void;
}> = ({ value, onChange }) => {
  const set = (i: number, patch: Partial<HorarioPayload>) =>
    onChange(value.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));

  return (
    <div className="gu-horarios">
      {value.map((h, i) => (
        <div className="gu-horario-row" key={i}>
          <select value={h.dia} onChange={(e) => set(i, { dia: e.target.value })}>
            {DIAS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <input type="time" value={h.horaInicio} onChange={(e) => set(i, { horaInicio: e.target.value })} />
          <input type="time" value={h.horaFin} onChange={(e) => set(i, { horaFin: e.target.value })} />
          <select value={h.tipoTurno ?? ""} onChange={(e) => set(i, { tipoTurno: e.target.value || undefined })}>
            <option value="">Turno</option>
            {TURNOS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <button type="button" className="gu-icon-btn" aria-label="Quitar horario"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}>×</button>
        </div>
      ))}
      <button type="button" className="gu-btn gu-btn--ghost gu-btn--sm"
        onClick={() => onChange([...value, { dia: "Lunes", horaInicio: "08:00", horaFin: "12:00", tipoTurno: "Mañana" }])}>
        Agregar horario
      </button>
    </div>
  );
};

// =====================================================
// MODAL CREAR / EDITAR
// =====================================================
interface UserModalProps {
  detalle?: UsuarioDetalle; // si viene, es edición
  especialidades: Catalogo[];
  onClose: () => void;
  onSaved: (mensaje: string) => void;
}

const UserModal: React.FC<UserModalProps> = ({ detalle, especialidades, onClose, onSaved }) => {
  const editando = !!detalle;
  const [rol, setRol] = useState<Rol>(detalle?.usuario.rol ?? "P");
  const [form, setForm] = useState<FormState>(detalle ? fromDetalle(detalle) : emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const upd = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const inp = (k: keyof FormState) => ({
    value: form[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => upd(k, e.target.value as never),
  });

  const horariosLimpios = (): HorarioPayload[] | string => {
    const filas = form.horarios.filter((h) => h.dia && h.horaInicio && h.horaFin);
    if (filas.some((h) => h.horaInicio >= h.horaFin)) return "En cada horario, la hora de inicio debe ser menor a la de fin.";
    return filas.map((h) => ({ ...h, tipoTurno: h.tipoTurno || undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    if (!editando) {
      if (!form.ci.trim() || !form.email.trim() || !form.password || !form.fechaNacimiento)
        return setError("CI, correo, contraseña y fecha de nacimiento son obligatorios.");
      if (form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    }
    if (rol === "M" && !form.matriculaProfesional.trim()) return setError("La matrícula profesional es obligatoria.");

    let horarios: HorarioPayload[] | undefined;
    if (rol !== "P") {
      const h = horariosLimpios();
      if (typeof h === "string") return setError(h);
      horarios = h;
    }

    setGuardando(true);
    try {
      if (editando && detalle) {
        const id = detalle.usuario.id;
        const base = { nombre: form.nombre.trim(), telefono: num(form.telefono), direccion: txt(form.direccion) };
        if (rol === "P") {
          await usuarioService.editarUsuarioAjeno("P", id, {
            ...base,
            grupoSanguineo: txt(form.grupoSanguineo),
            contactoEmergencia: num(form.contactoEmergencia),
            pesoKg: num(form.pesoKg),
            alturaCm: num(form.alturaCm),
          });
        } else if (rol === "M") {
          await usuarioService.editarUsuarioAjeno("M", id, {
            ...base,
            matriculaProfesional: form.matriculaProfesional.trim(),
            linkSalaVirtual: txt(form.linkSalaVirtual),
            estadoDisponibilidad: form.estadoDisponibilidad,
            especialidadIds: form.especialidadIds,
            horarios,
          });
        } else {
          await usuarioService.editarUsuarioAjeno("C", id, { ...base, horarios });
        }
        onSaved("Usuario actualizado correctamente.");
      } else {
        const comun = {
          ci: Number(form.ci),
          email: form.email.trim(),
          password: form.password,
          nombre: form.nombre.trim(),
          fechaNacimiento: form.fechaNacimiento,
          telefono: num(form.telefono),
          genero: txt(form.genero),
          direccion: txt(form.direccion),
        };
        if (rol === "P") {
          const payload: RegisterPacientePayload = {
            ...comun,
            grupoSanguineo: txt(form.grupoSanguineo),
            contactoEmergencia: num(form.contactoEmergencia),
            pesoKg: num(form.pesoKg),
            alturaCm: num(form.alturaCm),
          };
          await usuarioService.registrarPaciente(payload);
        } else {
          const payload: RegisterMedicoPayload = {
            ...comun,
            matriculaProfesional: form.matriculaProfesional.trim(),
            especialidadIds: form.especialidadIds,
            horarios: horarios ?? [],
            linkSalaVirtual: txt(form.linkSalaVirtual),
          };
          await usuarioService.registrarMedico(payload);
        }
        onSaved(`${ROLES[rol]} registrado correctamente.`);
      }
    } catch (err) {
      setError(errMsg(err));
      setGuardando(false);
    }
  };

  return (
    <div className="gu-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="gu-modal" onSubmit={submit} noValidate>
        <header className="gu-modal__head">
          <div>
            <h3>{editando ? "Editar usuario" : "Nuevo usuario"}</h3>
            <p>{editando ? `${ROLES[rol]} · ${detalle?.usuario.email}` : "Completa los datos para registrarlo en ClinIQ."}</p>
          </div>
          <button type="button" className="gu-icon-btn" aria-label="Cerrar" onClick={onClose}>×</button>
        </header>

        <div className="gu-modal__body">
          {!editando && (
            <div className="gu-tabs gu-tabs--inline" role="tablist">
              {(["P", "M"] as Rol[]).map((r) => (
                <button key={r} type="button" role="tab" aria-selected={rol === r}
                  className={`gu-tab${rol === r ? " is-active" : ""}`} onClick={() => setRol(r)}>
                  {ROLES[r]}
                </button>
              ))}
            </div>
          )}

          <div className="gu-grid">
            <Field label="Nombre completo" full><input type="text" {...inp("nombre")} /></Field>
            <Field label="Carnet de identidad (CI)">
              <input type="number" {...inp("ci")} disabled={editando} />
            </Field>
            <Field label="Correo electrónico">
              <input type="email" {...inp("email")} disabled={editando} />
            </Field>
            {!editando && (
              <Field label="Contraseña"><input type="password" {...inp("password")} autoComplete="new-password" /></Field>
            )}
            <Field label="Fecha de nacimiento">
              <input type="date" {...inp("fechaNacimiento")} disabled={editando} />
            </Field>
            <Field label="Género">
              <select {...inp("genero")} disabled={editando}>
                <option value="">Sin especificar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </Field>
            <Field label="Teléfono"><input type="number" {...inp("telefono")} /></Field>
            <Field label="Dirección" full={rol !== "P"}><input type="text" {...inp("direccion")} /></Field>

            {rol === "P" && (
              <>
                <Field label="Grupo sanguíneo">
                  <select {...inp("grupoSanguineo")}>
                    <option value="">Sin especificar</option>
                    {GRUPOS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Contacto de emergencia"><input type="number" {...inp("contactoEmergencia")} /></Field>
                <Field label="Peso (kg)"><input type="number" step="0.1" {...inp("pesoKg")} /></Field>
                <Field label="Altura (cm)"><input type="number" {...inp("alturaCm")} /></Field>
              </>
            )}

            {rol === "M" && (
              <>
                <Field label="Matrícula profesional"><input type="text" {...inp("matriculaProfesional")} /></Field>
                <Field label="Enlace de sala virtual"><input type="url" {...inp("linkSalaVirtual")} /></Field>
                {editando && (
                  <Field label="Disponibilidad" full>
                    <span className="gu-check">
                      <input type="checkbox" checked={form.estadoDisponibilidad}
                        onChange={(e) => upd("estadoDisponibilidad", e.target.checked)} />
                      Disponible para atender
                    </span>
                  </Field>
                )}
                <div className="gu-field gu-field--full">
                  <span>Especialidades</span>
                  <div className="gu-chips">
                    {especialidades.length === 0 && <em className="gu-muted">No hay especialidades registradas.</em>}
                    {especialidades.map((es) => {
                      const on = form.especialidadIds.includes(es.id);
                      return (
                        <button key={es.id} type="button" className={`gu-chip${on ? " is-on" : ""}`} aria-pressed={on}
                          onClick={() => upd("especialidadIds", on
                            ? form.especialidadIds.filter((x) => x !== es.id)
                            : [...form.especialidadIds, es.id])}>
                          {es.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {rol !== "P" && (
              <div className="gu-field gu-field--full">
                <span>Horarios de trabajo</span>
                <HorariosEditor value={form.horarios} onChange={(v) => upd("horarios", v)} />
              </div>
            )}
          </div>

          {error && <div className="gu-alert gu-alert--error" role="alert">{error}</div>}
        </div>

        <footer className="gu-modal__foot">
          <button type="button" className="gu-btn gu-btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="gu-btn gu-btn--primary" disabled={guardando}>
            {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Registrar usuario"}
          </button>
        </footer>
      </form>
    </div>
  );
};

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================
type ModalState = null | { detalle?: UsuarioDetalle };

export const GestionUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioDetalle[]>([]);
  const [especialidades, setEspecialidades] = useState<Catalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<"T" | Rol>("T");
  const [modal, setModal] = useState<ModalState>(null);
  const [aEliminar, setAEliminar] = useState<UsuarioDetalle | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const yo = usuarioService.getCurrentUser();

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [lista, esp] = await Promise.all([
        usuarioService.listarUsuarios(),
        usuarioService.listarEspecialidades().catch(() => [] as Catalogo[]),
      ]);
      setUsuarios(lista);
      setEspecialidades(esp);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  const conteo = useMemo(() => {
    const c = { T: usuarios.length, P: 0, M: 0, C: 0 };
    usuarios.forEach((u) => { c[u.usuario.rol]++; });
    return c;
  }, [usuarios]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios.filter(({ usuario: u }) => {
      if (filtroRol !== "T" && u.rol !== filtroRol) return false;
      if (!q) return true;
      return (
        u.nombre.toLowerCase().includes(q) ||
        String(u.ci).includes(q) ||
        (u.telefono != null && String(u.telefono).includes(q))
      );
    });
  }, [usuarios, busqueda, filtroRol]);

  const guardado = (texto: string) => {
    setModal(null);
    setAviso({ tipo: "ok", texto });
    cargar();
  };

  const confirmarEliminar = async () => {
    if (!aEliminar) return;
    setEliminando(true);
    try {
      await usuarioService.eliminarUsuario(aEliminar.usuario.id);
      setAviso({ tipo: "ok", texto: `Se eliminó a ${aEliminar.usuario.nombre}.` });
      setAEliminar(null);
      cargar();
    } catch (e) {
      setAviso({ tipo: "error", texto: errMsg(e) });
      setAEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const tabs: { key: "T" | Rol; label: string }[] = [
    { key: "T", label: "Todos" },
    { key: "P", label: "Pacientes" },
    { key: "M", label: "Médicos" },
    { key: "C", label: "Coordinadores" },
  ];

  return (
    <div className="gu-page">
      <div className="gu-head">
        <div>
          <h2>Gestión de usuarios</h2>
          <p>Pacientes, médicos y coordinadores registrados en ClinIQ.</p>
        </div>
        <button className="gu-btn gu-btn--primary" onClick={() => setModal({})}>Nuevo usuario</button>
      </div>

      {aviso && <div className={`gu-alert gu-alert--${aviso.tipo === "ok" ? "ok" : "error"}`} role="status">{aviso.texto}</div>}

      <section className="gu-card">
        <div className="gu-toolbar">
          <input
            type="search"
            className="gu-search"
            placeholder="Buscar por nombre, CI o teléfono"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar usuarios"
          />
          <div className="gu-tabs" role="tablist" aria-label="Filtrar por rol">
            {tabs.map((t) => (
              <button key={t.key} role="tab" aria-selected={filtroRol === t.key}
                className={`gu-tab${filtroRol === t.key ? " is-active" : ""}`}
                onClick={() => setFiltroRol(t.key)}>
                {t.label} <span className="gu-count">{conteo[t.key]}</span>
              </button>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="gu-empty">Cargando usuarios…</div>
        ) : error ? (
          <div className="gu-empty">
            <p>{error}</p>
            <button className="gu-btn gu-btn--ghost gu-btn--sm" onClick={cargar}>Reintentar</button>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="gu-empty">
            {usuarios.length === 0 ? "Aún no hay usuarios registrados." : "Ningún usuario coincide con la búsqueda."}
          </div>
        ) : (
          <div className="gu-table-wrap">
            <table className="gu-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>CI</th>
                  <th>Teléfono</th>
                  <th>Edad</th>
                  <th>Rol</th>
                  <th className="gu-th-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((d) => {
                  const u = d.usuario;
                  const edad = calcularEdad(u.fechaNacimiento);
                  const esYo = yo?.id === u.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="gu-user">
                          <span className="gu-avatar">{u.nombre.charAt(0).toUpperCase()}</span>
                          <div>
                            <strong>{u.nombre}{esYo && <em className="gu-you"> (tú)</em>}</strong>
                            <small>{u.email}</small>
                            {u.rol === "M" && d.especialidades && d.especialidades.length > 0 && (
                              <small>{d.especialidades.map((e) => e.nombre).join(", ")}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{u.ci}</td>
                      <td>{u.telefono ?? "—"}</td>
                      <td>{edad !== null ? `${edad} años` : "—"}</td>
                      <td><span className={`gu-badge gu-badge--${u.rol}`}>{ROLES[u.rol]}</span></td>
                      <td>
                        <div className="gu-actions">
                          <button className="gu-btn gu-btn--ghost gu-btn--sm" onClick={() => setModal({ detalle: d })}>Editar</button>
                          <button className="gu-btn gu-btn--danger gu-btn--sm" disabled={esYo}
                            title={esYo ? "No puedes eliminar tu propia cuenta" : undefined}
                            onClick={() => setAEliminar(d)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && (
        <UserModal
          detalle={modal.detalle}
          especialidades={especialidades}
          onClose={() => setModal(null)}
          onSaved={guardado}
        />
      )}

      {aEliminar && (
        <div className="gu-overlay" onMouseDown={(e) => e.target === e.currentTarget && setAEliminar(null)}>
          <div className="gu-modal gu-modal--sm" role="alertdialog" aria-labelledby="gu-del-title">
            <header className="gu-modal__head">
              <div>
                <h3 id="gu-del-title">Eliminar usuario</h3>
                <p>Se eliminará a <strong>{aEliminar.usuario.nombre}</strong> ({ROLES[aEliminar.usuario.rol]}). Esta acción no se puede deshacer.</p>
              </div>
            </header>
            <footer className="gu-modal__foot">
              <button className="gu-btn gu-btn--ghost" onClick={() => setAEliminar(null)}>Cancelar</button>
              <button className="gu-btn gu-btn--dangerSolid" disabled={eliminando} onClick={confirmarEliminar}>
                {eliminando ? "Eliminando…" : "Eliminar"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;