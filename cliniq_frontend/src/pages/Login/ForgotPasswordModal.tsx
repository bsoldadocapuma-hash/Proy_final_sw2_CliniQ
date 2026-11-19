import React, { useState } from 'react';
import './LoginModal.css';
import { usuarioService } from '../../services/usuarioService';

interface ForgotPasswordModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (nuevaPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const res = await usuarioService.cambiarPassword({
        email,
        passwordActual,
        nuevaPassword,
      });

      setSuccess(res.message || 'Contraseña actualizada correctamente.');
      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="modal-content-single">
          <span className="modal-greeting">RECUPERACIÓN</span>
          <h2 className="modal-title">Actualizar contraseña</h2>

          {error && (
            <div style={{ color: '#ef4444', marginBottom: '14px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ color: '#10b981', marginBottom: '14px', fontSize: '13px' }}>
              {success}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>Dirección de correo electrónico</label>
            <input
              type="email"
              placeholder="tucorreo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Contraseña actual</label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña actual"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              required
            />

            <label>Nueva contraseña</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              minLength={6}
              required
            />

            <label>Confirmar nueva contraseña</label>
            <input
              type="password"
              placeholder="Repite la nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'ACTUALIZANDO...' : 'CAMBIAR CONTRASEÑA'}
            </button>
          </form>

          <div className="auth-prompt">
            ¿Recordaste tu contraseña?{' '}
            <span className="switch-link" onClick={onSwitchToLogin}>Volver a iniciar sesión</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;