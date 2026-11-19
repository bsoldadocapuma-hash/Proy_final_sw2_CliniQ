import React, { useState } from 'react';
import './Home.css';
import LoginModal from '../Login/LoginModal';
import RegisterModal from '../Register/RegisterModal';
import ForgotPasswordModal from '../Login/ForgotPasswordModal';

import homeImage from '../../assets/images/home_cliniq.png';

const Home: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'login' | 'register' | 'forgot' | null>(null);

  return (
    <div className="home-wrapper">
      {/* ============ NAVBAR ============ */}
      <nav className="navbar-home">
        <div className="navbar-logo">
          <img src="/favicon.svg" alt="ClinIQ Logo" className="logo-icon" />
          <span className="logo-text">ClinIQ</span>
        </div>

        <div className="navbar-actions">
          <button className="btn-login-text" onClick={() => setActiveModal('login')}>
            Iniciar sesión
          </button>
          <button className="btn-register-solid" onClick={() => setActiveModal('register')}>
            Cuenta gratuita
          </button>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <main className="hero-section">
        <div className="hero-content">
          <span className="hero-subtitle">TU BIENESTAR EN PRIMER LUGAR</span>

          <h1 className="hero-title">
            ¡Toma el control de tu salud con la mejor atención!
          </h1>

          <p className="hero-desc">
            Tu tranquilidad y el cuidado oportuno de tu salud son nuestra prioridad absoluta. 
            Sabemos lo agotador que resulta lidiar con la incertidumbre en salas de espera y 
            la lentitud de los procesos tradicionales cuando no te sientes bien. En CliniQ, 
            transformamos esa experiencia poniendo a tu alcance un ecosistema médico moderno, 
            ágil y humano que te acompaña desde el primer síntoma hasta tu completa recuperación.
          </p>

          <p className="hero-desc">
            Gracias a nuestra tecnología de triaje asistido por inteligencia artificial y 
            basado en estándares internacionales como la Escala Manchester, puedes evaluar tu 
            estado de forma rápida y objetiva. El sistema analiza con precisión tus síntomas 
            para determinar el nivel de urgencia adecuado.
          </p>

          <p className="hero-desc">
            Centraliza el control de tu bienestar en un solo lugar seguro e intuitivo: accede 
            a consultas médicas por telemedicina sin salir de casa, recibe recetas digitales 
            certificadas y aprovecha modelos predictivos de Machine Learning que alertan sobre 
            posibles riesgos clínicos de forma temprana. Además, cada diagnóstico, estudio y 
            receta queda protegido bajo tecnología Blockchain, garantizando que tu historial 
            sea completamente privado, inviolable y esté siempre disponible cuando lo requieras.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => setActiveModal('register')}>
              ¡Crea tu cuenta GRATIS!
            </button>
          </div>
        </div>

        <div className="hero-visuals">
          <img src={homeImage} alt="Interfaz de ClinIQ" className="hero-image" />
        </div>
      </main>

      {/* ============ MODALES ============ */}
      {activeModal === 'login' && (
        <LoginModal
          onClose={() => setActiveModal(null)}
          onSwitchToRegister={() => setActiveModal('register')}
          onForgotPassword={() => setActiveModal('forgot')}
        />
      )}

      {activeModal === 'register' && (
        <RegisterModal
          onClose={() => setActiveModal(null)}
          onSwitchToLogin={() => setActiveModal('login')}
        />
      )}

      {activeModal === 'forgot' && (
        <ForgotPasswordModal
          onClose={() => setActiveModal(null)}
          onSwitchToLogin={() => setActiveModal('login')}
        />
      )}
    </div>
  );
};

export default Home;