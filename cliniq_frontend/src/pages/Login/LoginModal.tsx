import React, { useState } from 'react';
import './LoginModal.css';
import { usuarioService } from '../../services/usuarioService';

interface LoginModalProps {
  onClose: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSwitchToRegister, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Guarda access_token y user (usuario + horarios/especialidades según rol) en localStorage
      await usuarioService.login({ email, password });
      onClose();
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="modal-content-single">
          <span className="modal-greeting">BIENVENIDO DE NUEVO</span>
          <h2 className="modal-title">Inicia sesión en CliniQ</h2>

          {error && (
            <div style={{ color: '#ef4444', marginBottom: '14px', fontSize: '13px' }}>
              {error}
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

            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Ingresa la contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <span
              className="forgot-password"
              style={{ cursor: 'pointer' }}
              onClick={onForgotPassword}
            >
              ¿Olvidaste tu contraseña?
            </span>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
            </button>
          </form>

          <div className="auth-prompt">
            ¿Aún no tienes una cuenta?{' '}
            <span className="switch-link" onClick={onSwitchToRegister}>Regístrate GRATIS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;