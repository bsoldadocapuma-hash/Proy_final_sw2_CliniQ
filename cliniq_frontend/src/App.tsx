import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importamos las páginas
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: Landing Page con Login/Registro */}
        <Route path="/" element={<Home />} />

        {/* Dashboard único (el contenido se adapta según el rol) */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* URLs viejas (/dashboard/paciente, /dashboard/medico, etc.) */}
        <Route path="/dashboard/*" element={<Navigate to="/dashboard" replace />} />

        {/* Cualquier otra ruta vuelve al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;