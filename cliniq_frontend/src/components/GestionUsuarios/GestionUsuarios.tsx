import React, { useEffect, useState } from 'react';
import { authService, type UsuarioItem } from '../../services/authService';
import './GestionUsuarios.css';

export const GestionUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados de Búsqueda, Ordenamiento y Detalles
  const [busqueda, setBusqueda] = useState('');
  const [ordenarPor, setOrdenarPor] = useState<'ninguno' | 'rol' | 'edad'>('ninguno');
  const [usuarioDetalle, setUsuarioDetalle] = useState<UsuarioItem | null>(null);

  // Estado del Modal de Registro
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', ci: '', email: '', password: '', telefono: '',
    rol: 'M' as 'M' | 'C', fecha_nacimiento: '', genero: 'M',
    direccion: '', matricula_profesional: '',
  });

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await authService.listarUsuarios();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await authService.eliminarUsuario(id);
      setSuccessMsg('Usuario eliminado correctamente');
      cargarUsuarios();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegistroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await authService.registerPersonal({
        nombre: formData.nombre,
        ci: Number(formData.ci),
        email: formData.email,
        password: formData.password,
        telefono: Number(formData.telefono),
        rol: formData.rol,
        fecha_nacimiento: formData.fecha_nacimiento,
        genero: formData.genero,
        direccion: formData.direccion,
        matricula_profesional: formData.rol === 'M' ? formData.matricula_profesional : undefined,
      });
      
      setShowModal(false);
      setSuccessMsg('Personal registrado exitosamente');
      setFormData({ 
        nombre: '', ci: '', email: '', password: '', telefono: '', 
        rol: 'M', fecha_nacimiento: '', genero: 'M', direccion: '', matricula_profesional: '' 
      });
      
      cargarUsuarios();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar personal');
    }
  };

  // Función auxiliar para calcular edad
  const calcularEdad = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    return edad;
  };

  // Filtrar y ordenar usuarios
  const usuariosProcesados = usuarios
    .filter(u => u.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      if (ordenarPor === 'rol') {
        return a.rol.localeCompare(b.rol);
      } else if (ordenarPor === 'edad') {
        return calcularEdad(a.fecha_nacimiento) - calcularEdad(b.fecha_nacimiento);
      }
      return 0;
    });

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <div>
          <h2>Control de Usuarios y Personal</h2>
          <p>Administra las cuentas de médicos, coordinadores y pacientes registrados.</p>
        </div>
        <button className="btn-nuevo" onClick={() => setShowModal(true)}>
          + Registrar Nuevo Personal
        </button>
      </div>

      <div className="filtros-container">
        <input 
          type="text" 
          placeholder="🔍 Buscar usuario por nombre..." 
          value={busqueda} 
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-buscar"
        />
        <select 
          value={ordenarPor} 
          onChange={(e) => setOrdenarPor(e.target.value as 'ninguno' | 'rol' | 'edad')}
          className="select-ordenar"
        >
          <option value="ninguno">Ordenar por: Defecto</option>
          <option value="rol">Ordenar por: Rol</option>
          <option value="edad">Ordenar por: Edad</option>
        </select>
      </div>

      {error && <div className="alert error">{error}</div>}
      {successMsg && <div className="alert success">{successMsg}</div>}

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <div className="table-responsive">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>CI</th>
                <th>Nombre Completo</th>
                <th>Email</th>
                <th>Edad</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosProcesados.map((u) => (
                <tr key={u.id}>
                  <td>{u.ci}</td>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>{u.fecha_nacimiento ? `${calcularEdad(u.fecha_nacimiento)} años` : 'N/D'}</td>
                  <td>
                    <span className={`badge rol-${u.rol.toLowerCase()}`}>
                      {u.rol === 'P' ? 'Paciente' : u.rol === 'M' ? 'Médico' : 'Coordinador'}
                    </span>
                  </td>
                  <td>
                    <div className="acciones-celda">
                      <button className="btn-detalle" onClick={() => setUsuarioDetalle(u)}>Ver Detalle</button>
                      <button className="btn-delete" onClick={() => handleEliminar(u.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE REGISTRO */}
      {showModal && (
        /* ... Tu modal de registro actual queda exactamente igual aquí ... */
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            <h3>Registrar Médico o Coordinador</h3>
            <form onSubmit={handleRegistroSubmit} className="modal-form">
              {/* Contenido del form */}
              <label>Rol institucional</label>
              <select name="rol" value={formData.rol} onChange={handleInputChange}>
                <option value="M">Médico</option>
                <option value="C">Coordinador</option>
              </select>
              <label>Nombre completo</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
              <label>Carnet de Identidad (CI)</label>
              <input type="number" name="ci" value={formData.ci} onChange={handleInputChange} required />
              <label>Correo Electrónico</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              <label>Contraseña</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              <label>Teléfono</label>
              <input type="number" name="telefono" value={formData.telefono} onChange={handleInputChange} required />
              <label>Fecha de Nacimiento</label>
              <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange} required />
              <label>Género</label>
              <select name="genero" value={formData.genero} onChange={handleInputChange} required>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
              <label>Dirección</label>
              <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} required />
              {formData.rol === 'M' && (
                <>
                  <label>Matrícula Profesional</label>
                  <input type="text" name="matricula_profesional" value={formData.matricula_profesional} onChange={handleInputChange} required />
                </>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-submit">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES */}
      {usuarioDetalle && (
        <div className="modal-overlay">
          <div className="modal-box detalles-box">
            <button className="close-btn" onClick={() => setUsuarioDetalle(null)}>&times;</button>
            <h3>Detalles del Usuario</h3>
            <div className="detalle-grid">
              {Object.entries(usuarioDetalle).map(([key, value]) => {
                // Excluir id, password o campos nulos/vacíos
                if (key === 'id' || key === 'password' || key === 'passwordActual') return null;
                
                let valorMostrado = value;
                if (key === 'rol') {
                   valorMostrado = value === 'P' ? 'Paciente' : value === 'M' ? 'Médico' : 'Coordinador';
                }

                return (
                  <div key={key} className="detalle-item">
                    <span className="detalle-label">{key.replace('_', ' ').toUpperCase()}</span>
                    <span className="detalle-valor">{valorMostrado !== null && valorMostrado !== undefined && valorMostrado !== '' ? String(valorMostrado) : 'N/D'}</span>
                  </div>
                );
              })}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setUsuarioDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};