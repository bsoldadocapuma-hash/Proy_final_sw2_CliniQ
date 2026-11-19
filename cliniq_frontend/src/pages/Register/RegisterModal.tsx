import React, { useState } from 'react';
import './RegisterModal.css';
import { usuarioService } from '../../services/usuarioService';

interface RegisterModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    ci: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    fechaNacimiento: '',
    genero: 'M',
    direccion: '',
    grupoSanguineo: 'O+',
    contactoEmergencia: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      // 1. Registrar paciente (solo envía lo que el usuario llenó; lo opcional va undefined)
      await usuarioService.registrarPaciente({
        nombre: formData.nombre,
        ci: Number(formData.ci),
        email: formData.email,
        password: formData.password,
        fechaNacimiento: formData.fechaNacimiento,
        genero: formData.genero,
        telefono: formData.telefono ? Number(formData.telefono) : undefined,
        direccion: formData.direccion || undefined,
        grupoSanguineo: formData.grupoSanguineo || undefined,
        contactoEmergencia: formData.contactoEmergencia
          ? Number(formData.contactoEmergencia)
          : undefined,
      });

      // 2. El registro no devuelve token, así que se inicia sesión automáticamente
      await usuarioService.login({
        email: formData.email,
        password: formData.password,
      });

      onClose();
      window.location.href = '/dashboard/paciente';
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box register-box">
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="modal-content-single">
          <span className="modal-greeting register-greeting">NUEVO PACIENTE</span>
          <h2 className="modal-title">Crea tu cuenta gratis</h2>

          {error && (
            <div style={{ color: '#ef4444', marginBottom: '14px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>Nombre completo</label>
            <input
              type="text"
              name="nombre"
              placeholder="Ej. Juan Pérez"
              value={formData.nombre}
              onChange={handleChange}
              required
            />

            {/* Fila doble: CI y Género */}
            <div className="form-row">
              <div className="form-group">
                <label>Carnet de Identidad (CI)</label>
                <input
                  type="number"
                  name="ci"
                  className="no-spin"
                  placeholder="Ej. 7891234"
                  value={formData.ci}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Género</label>
                <select
                  name="genero"
                  className="auth-select"
                  value={formData.genero}
                  onChange={handleChange}
                  required
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
            </div>

            <label>Fecha de nacimiento</label>
            <input
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              required
            />

            <label>Dirección de correo electrónico</label>
            <input
              type="email"
              name="email"
              placeholder="tucorreo@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
            />

            <label>Confirmar contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'REGISTRANDO...' : 'REGISTRARSE'}
            </button>
          </form>

          <div className="auth-prompt">
            ¿Ya tienes una cuenta?{' '}
            <span className="switch-link" onClick={onSwitchToLogin}>Inicia sesión aquí</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;