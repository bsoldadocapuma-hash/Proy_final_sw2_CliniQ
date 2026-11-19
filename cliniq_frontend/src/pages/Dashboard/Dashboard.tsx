import React, { useState, useEffect, useRef } from "react";
import "./Dashboard.css";
import { usuarioService } from "../../services/usuarioService";

// Paciente
import { InicioPacienteModulo } from "../Modulos/Paciente/InicioPacienteModulo/InicioPacienteModulo";
import { ReservaCitaIA } from "../Modulos/Paciente/ReservaCitaIA/ReservaCitaIA";
import { HistorialClinico } from "../Modulos/Paciente/HistorialClinico/HistorialClinico";
import { HistorialCitas } from "../Modulos/Paciente/HistorialCitas/HistorialCitas";
import { PerfilPacienteModulo } from "../Modulos/Paciente/PerfilPacienteModulo/PerfilPacienteModulo";

// Médico
import { PanelControlClinico } from "../Modulos/Medico/PanelControlClinico/PanelControlClinico";
import { CrearExpediente } from "../Modulos/Medico/CrearExpediente/CrearExpediente";
import { AlertasRiesgo } from "../Modulos/Medico/AlertasRiesgo/AlertasRiesgo";
import { PerfilMedicoModulo } from "../Modulos/Medico/PerfilMedicoModulo/PerfilMedicoModulo";

// Coordinador
import { InicioCoordinador } from "../Modulos/Coordinador/InicioCoordinador/InicioCoordinador";
import { GestionUsuarios } from "../Modulos/Coordinador/GestionUsuarios/GestionUsuarios";
import { PerfilCoordinadorModulo } from "../Modulos/Coordinador/PerfilCoordinadorModulo/PerfilCoordinadorModulo";

type Rol = "P" | "M" | "C";

interface MenuItem {
  label: string;
  view: string;
}

// ================= MENÚ POR ROL =================
const MENU_BY_ROL: Record<Rol, MenuItem[]> = {
  P: [
    { label: "Panel de Control Clínico", view: "inicio" },
    { label: "Reserva de Cita IA", view: "triaje-ia" },
    { label: "Historial Clínico", view: "historial" },
    { label: "Historial de Citas", view: "citas" },
    { label: "Perfil", view: "perfil" },
  ],
  M: [
    { label: "Panel de Control Clínico", view: "inicio" },
    { label: "Expediente", view: "crear-expediente" },
    { label: "Pacientes", view: "prediccion-riesgo" },
    { label: "Perfil", view: "perfil" },
  ],
  C: [
    { label: "Panel de Control Clínico", view: "inicio" },
    { label: "Gestión de Usuarios", view: "gestion-usuarios" },
    { label: "Perfil", view: "perfil" },
  ],
};

// ================= VISTAS POR ROL =================
const VIEWS_BY_ROL: Record<Rol, Record<string, React.ReactNode>> = {
  P: {
    inicio: <InicioPacienteModulo />,
    "triaje-ia": <ReservaCitaIA />,
    historial: <HistorialClinico />,
    citas: <HistorialCitas />,
    perfil: <PerfilPacienteModulo />,
  },
  M: {
    inicio: <PanelControlClinico />,
    "crear-expediente": <CrearExpediente />,
    "prediccion-riesgo": <AlertasRiesgo />,
    perfil: <PerfilMedicoModulo />,
  },
  C: {
    inicio: <InicioCoordinador />,
    "gestion-usuarios": <GestionUsuarios />,
    perfil: <PerfilCoordinadorModulo />,
  },
};

const ROL_DEFAULTS: Record<Rol, { nombre: string; email: string; inicial: string }> = {
  P: { nombre: "Paciente", email: "paciente@cliniq.com", inicial: "P" },
  M: { nombre: "Dr. Médico", email: "medico@cliniq.com", inicial: "M" },
  C: { nombre: "Coordinador", email: "coordinador@cliniq.com", inicial: "C" },
};

const ROL_LABEL: Record<Rol, string> = {
  P: "Paciente",
  M: "Médico",
  C: "Coordinador",
};

// ================= COMPONENTE =================
export const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<string>("inicio");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  // Datos de la tabla usuario guardados en el login (localStorage)
  const currentUser = usuarioService.getCurrentUser();
  const rol = currentUser?.rol as Rol | undefined;
  const rolValido = !!rol && !!MENU_BY_ROL[rol];

  // Sin sesión o rol inválido => al inicio
  useEffect(() => {
    if (!rolValido) window.location.href = "/";
  }, [rolValido]);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!rolValido || !rol) return null;

  const menu = MENU_BY_ROL[rol];
  const defaults = ROL_DEFAULTS[rol];

  const toggle = (name: string) => setOpenDropdown((prev) => (prev === name ? null : name));

  const handleSelect = (view: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveView(view);
    setOpenDropdown(null);
  };

  // Cierra sesión y vuelve a la interfaz de Home
  const handleLogout = () => {
    usuarioService.logout();
    window.location.href = "/";
  };

  const perfilExtra =
    rol === "P"
      ? `CI: ${currentUser?.ci || "Sin registrar"}`
      : rol === "M"
      ? `Matrícula: ${currentUser?.matriculaProfesional || "Sin registrar"}`
      : "Rol: Coordinador";

  // ================= HTML (JSX) =================
  return (
    <div className="dashboard">
      {/* ============ NAVBAR ============ */}
      <nav className="dashboard-navbar" ref={navRef}>
        <div className="navbar-logo">
          <img src="/favicon.svg" alt="ClinIQ Logo" className="logo-icon" />
          <span className="logo-text">
            ClinIQ {rol === "M" && <small style={{ fontSize: "10px", color: "#357e65" }}>MEDIC</small>}
          </span>
        </div>

        <div className="navbar-menu">
          {menu.map((item) => (
            <a
              key={item.view}
              href={`#${item.view}`}
              className={`nav-item nav-link ${activeView === item.view ? "active" : ""}`}
              onClick={(e) => handleSelect(item.view, e)}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="navbar-right">
          {/* 1. Botón Log out */}
          <button className="logout-btn" data-text="log out" onClick={handleLogout}>
            log out
          </button>

          {/* 2. Campanita */}
          <button className="notification-btn" aria-label="Notificaciones">
            <svg className="notification-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* 3. Perfil */}
          <div className="account-dropdown-wrapper" onClick={() => toggle("perfil")}>
            <div className="account-info">
              <div className="account-name">{currentUser?.nombre || defaults.nombre}</div>
              <div className="account-role">{ROL_LABEL[rol]}</div>
              <div className="account-bottom">
                <span className="email">{currentUser?.email || defaults.email}</span>
              </div>
            </div>
            <div className="profile-circle">
              {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : defaults.inicial}
            </div>

            {openDropdown === "perfil" && (
              <div className="dropdown-menu profile-dropdown">
                <div className="dropdown-header">
                  <b>{perfilExtra}</b>
                </div>
                <hr className="dropdown-divider" />
                <button className="dropdown-item text-danger" onClick={handleLogout}>
                  <div className="item-title">Cerrar Sesión</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ============ CONTENIDO ============ */}
      <main className={`dashboard-content ${rol === "P" ? "no-padding" : ""}`}>
        {VIEWS_BY_ROL[rol][activeView] ?? null}
      </main>
    </div>
  );
};

export default Dashboard;