const API_URL = 'http://localhost:3000/usuarios';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPacientePayload {
  ci: number;
  email: string;
  password: string;
  nombre: string;
  telefono: number;
  fecha_nacimiento: string;
  genero: string;
  direccion: string;
  grupo_sanguineo?: string;
  contacto_emergencia?: number;
}

export interface RegisterPersonalPayload {
  ci: number;
  email: string;
  password: string;
  nombre: string;
  telefono: number;
  rol: 'M' | 'C';
  fecha_nacimiento: string;
  genero: string;
  direccion: string;
  matricula_profesional?: string;
  firma_digital?: string;
}

export interface CambiarPasswordPayload {
  email: string;
  passwordActual: string;
  nuevaPassword: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  user: {
    id: number;
    ci: number;
    nombre: string;
    email: string;
    rol: string;
  };
}

export interface UsuarioItem {
  id: number;
  ci: number;
  nombre: string;
  email: string;
  rol: string;
  telefono?: number;
  fecha_nacimiento?: string;
  genero?: string;
  direccion?: string;
  matricula_profesional?: string;
  grupo_sanguineo?: string;
  contacto_emergencia?: number;
  [key: string]: any; // Esta línea permite iterar dinámicamente sobre las propiedades en el modal sin generar errores de TypeScript
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }

    localStorage.setItem('cliniq_token', data.access_token);
    localStorage.setItem('cliniq_user', JSON.stringify(data.user));

    return data;
  },

  async registerPaciente(payload: RegisterPacientePayload) {
    const response = await fetch(`${API_URL}/registro/paciente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error en el registro');
    }

    return await this.login({
      email: payload.email,
      password: payload.password,
    });
  },

  async registerPersonal(payload: RegisterPersonalPayload) {
    const endpoint = payload.rol === 'M' ? '/registro/medico' : '/registro/coordinador';
    const token = localStorage.getItem('cliniq_token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error al registrar personal');
    }
    return data;
  },

  async cambiarPassword(payload: CambiarPasswordPayload) {
    const response = await fetch(`${API_URL}/cambiar-password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error al actualizar la contraseña');
    }
    return data;
  },

  async listarUsuarios(): Promise<UsuarioItem[]> {
    const token = localStorage.getItem('cliniq_token');
    const response = await fetch(`${API_URL}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error al obtener el listado de usuarios');
    }
    return data;
  },

  async eliminarUsuario(id: number) {
    const token = localStorage.getItem('cliniq_token');
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Error al eliminar el usuario');
    }
    return data;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('cliniq_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  logout() {
    localStorage.removeItem('cliniq_token');
    localStorage.removeItem('cliniq_user');
  },
};