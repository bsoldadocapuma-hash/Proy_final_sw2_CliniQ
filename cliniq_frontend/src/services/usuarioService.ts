import { API_BASE_URL } from '../config/apiConfig';

// Rutas derivadas de la URL base
const API_USUARIOS_URL = `${API_BASE_URL}/usuarios`;
const API_ALERGIAS_URL = `${API_BASE_URL}/alergias`;
const API_ESPECIALIDADES_URL = `${API_BASE_URL}/especialidades`;

// =====================================================
// TIPOS: REQUESTS
// =====================================================
export interface LoginPayload {
  email: string;
  password: string;
}

export interface HorarioPayload {
  dia: string;
  horaInicio: string; // "08:00"
  horaFin: string;    // "12:00"
  tipoTurno?: string;
}

export interface RegisterPacientePayload {
  ci: number;
  email: string;
  password: string;
  nombre: string;
  fechaNacimiento: string; // "1999-06-01"
  telefono?: number;
  genero?: string;
  grupoSanguineo?: string;
  direccion?: string;
  contactoEmergencia?: number;
  pesoKg?: number;
  alturaCm?: number;
}

export interface RegisterMedicoPayload {
  ci: number;
  email: string;
  password: string;
  nombre: string;
  fechaNacimiento: string;
  matriculaProfesional: string;
  especialidadIds: number[];
  horarios: HorarioPayload[];
  telefono?: number;
  genero?: string;
  direccion?: string;
  linkSalaVirtual?: string;
  firmaDigital?: string;
  blockchainPubKey?: string;
  foto?: string;
}

export interface RegisterCoordinadorPayload {
  ci: number;
  email: string;
  password: string;
  nombre: string;
  fechaNacimiento: string;
  horarios: HorarioPayload[];
  telefono?: number;
  genero?: string;
  direccion?: string;
}

export interface CambiarPasswordPayload {
  email: string;
  passwordActual: string;
  nuevaPassword: string;
}

export interface UpdatePacientePayload {
  nombre?: string;
  telefono?: number;
  direccion?: string;
  grupoSanguineo?: string;
  contactoEmergencia?: number;
  pesoKg?: number;
  alturaCm?: number;
}

export interface UpdateMedicoPayload {
  nombre?: string;
  telefono?: number;
  direccion?: string;
  matriculaProfesional?: string;
  linkSalaVirtual?: string;
  foto?: string;
  estadoDisponibilidad?: boolean;
  especialidadIds?: number[]; // si se envía, reemplaza todas
  horarios?: HorarioPayload[]; // si se envía, reemplaza todos
}

export interface UpdateCoordinadorPayload {
  nombre?: string;
  telefono?: number;
  direccion?: string;
  horarios?: HorarioPayload[]; // si se envía, reemplaza todos
}

export interface SeguroPayload {
  nombreAseguradora: string;
  numeroPoliza: string;
  fechaInicioVigencia: string;
  fechaFinVigencia: string;
  tipoCobertura?: string;
  porcentajeCobertura?: number;
  copago?: number;
  esPrincipal?: boolean;
}

export interface CatalogoPayload {
  nombre: string;
}

// =====================================================
// TIPOS: RESPONSES
// =====================================================
export interface Usuario {
  id: number;
  ci: number;
  email: string;
  nombre: string;
  telefono: number | null;
  fechaNacimiento: string | null;
  genero: string | null;
  rol: 'P' | 'M' | 'C';
  grupoSanguineo: string | null;
  direccion: string | null;
  contactoEmergencia: number | null;
  matriculaProfesional: string | null;
  estadoDisponibilidad: boolean | null;
  linkSalaVirtual: string | null;
  foto: string | null;
  pesoKg: number | null;
  alturaCm: number | null;
}

export interface Catalogo {
  id: number;
  nombre: string;
}

export interface Horario {
  id: number;
  dia: string;
  horaInicio: string; // "08:00:00"
  horaFin: string;
  tipoTurno: string | null;
}

export interface Seguro {
  id: number;
  nombreAseguradora: string;
  numeroPoliza: string;
  tipoCobertura: string | null;
  porcentajeCobertura: number | null;
  copago: number | null;
  fechaInicioVigencia: string;
  fechaFinVigencia: string;
  esPrincipal: boolean;
}

/**
 * Respuesta por rol (los campos que no aplican NO vienen en el JSON):
 *  - Paciente:    usuario (+ alergias y seguros en listarUsuarios)
 *  - Médico:      usuario + especialidades + horarios
 *  - Coordinador: usuario + horarios
 */
export interface UsuarioDetalle {
  usuario: Usuario;
  alergias?: Catalogo[];
  seguros?: Seguro[];
  especialidades?: Catalogo[];
  horarios?: Horario[];
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: UsuarioDetalle;
}

export interface MessageResponse {
  message: string;
}

// =====================================================
// HELPER HTTP
// =====================================================
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(url: string, method: string = 'GET', body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  // Cuando actives la validación del token en el backend, ya se enviará solo.
  const token = localStorage.getItem('access_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    // Spring devuelve { status, error, message, path }
    const msg = data?.message || data?.error || `Error ${response.status}`;
    throw new ApiError(msg, response.status);
  }
  return data as T;
}

// =====================================================
// SERVICE
// =====================================================
export const usuarioService = {
  // ---------- AUTH ----------
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const data = await request<AuthResponse>(`${API_USUARIOS_URL}/login`, 'POST', payload);
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  // ---------- SESIÓN ----------
  /** Detalle completo guardado en el login (usuario + horarios/especialidades según rol). */
  getUsuarioDetalle(): UsuarioDetalle | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as UsuarioDetalle) : null;
    } catch {
      return null;
    }
  },

  /** Solo los datos de la tabla usuario (id, nombre, email, rol...). */
  getCurrentUser(): Usuario | null {
    return this.getUsuarioDetalle()?.usuario ?? null;
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  // ---------- REGISTROS ----------
  registrarPaciente(payload: RegisterPacientePayload): Promise<Usuario> {
    return request<Usuario>(`${API_USUARIOS_URL}/registro/paciente`, 'POST', payload);
  },

  registrarMedico(payload: RegisterMedicoPayload): Promise<Usuario> {
    return request<Usuario>(`${API_USUARIOS_URL}/registro/medico`, 'POST', payload);
  },

  registrarCoordinador(payload: RegisterCoordinadorPayload): Promise<Usuario> {
    return request<Usuario>(`${API_USUARIOS_URL}/registro/coordinador`, 'POST', payload);
  },

  cambiarPassword(payload: CambiarPasswordPayload): Promise<MessageResponse> {
    return request<MessageResponse>(`${API_USUARIOS_URL}/cambiar-password`, 'PATCH', payload);
  },

  // ---------- USUARIOS ----------
  listarUsuarios(): Promise<UsuarioDetalle[]> {
    return request<UsuarioDetalle[]>(API_USUARIOS_URL);
  },

  eliminarUsuario(id: number): Promise<MessageResponse> {
    return request<MessageResponse>(`${API_USUARIOS_URL}/${id}`, 'DELETE');
  },

  // ---------- MODIFICAR PERFIL (uno por rol) ----------
  // Guardan la respuesta en localStorage: usar solo para el perfil del usuario logueado.
  async modificarPerfilPaciente(id: number, payload: UpdatePacientePayload): Promise<UsuarioDetalle> {
    const data = await request<UsuarioDetalle>(`${API_USUARIOS_URL}/paciente/${id}/perfil`, 'PATCH', payload);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  async modificarPerfilMedico(id: number, payload: UpdateMedicoPayload): Promise<UsuarioDetalle> {
    const data = await request<UsuarioDetalle>(`${API_USUARIOS_URL}/medico/${id}/perfil`, 'PATCH', payload);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  async modificarPerfilCoordinador(id: number, payload: UpdateCoordinadorPayload): Promise<UsuarioDetalle> {
    const data = await request<UsuarioDetalle>(`${API_USUARIOS_URL}/coordinador/${id}/perfil`, 'PATCH', payload);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  // ---------- EDITAR A OTRO USUARIO (gestión de usuarios) ----------
  // No pisa la sesión: solo actualiza localStorage si el usuario editado es el logueado.
  async editarUsuarioAjeno(
    rol: 'P' | 'M' | 'C',
    id: number,
    payload: UpdatePacientePayload | UpdateMedicoPayload | UpdateCoordinadorPayload
  ): Promise<UsuarioDetalle> {
    const ruta = rol === 'P' ? 'paciente' : rol === 'M' ? 'medico' : 'coordinador';
    const data = await request<UsuarioDetalle>(`${API_USUARIOS_URL}/${ruta}/${id}/perfil`, 'PATCH', payload);
    if (this.getCurrentUser()?.id === id) {
      localStorage.setItem('user', JSON.stringify(data));
    }
    return data;
  },

  // ---------- ALERGIAS DEL PACIENTE ----------
  agregarAlergiaAPaciente(idUsuario: number, idAlergia: number): Promise<Catalogo> {
    return request<Catalogo>(`${API_USUARIOS_URL}/${idUsuario}/alergias/${idAlergia}`, 'POST');
  },

  obtenerAlergiasDePaciente(idUsuario: number): Promise<Catalogo[]> {
    return request<Catalogo[]>(`${API_USUARIOS_URL}/${idUsuario}/alergias`);
  },

  quitarAlergiaDePaciente(idUsuario: number, idAlergia: number): Promise<MessageResponse> {
    return request<MessageResponse>(`${API_USUARIOS_URL}/${idUsuario}/alergias/${idAlergia}`, 'DELETE');
  },

  // ---------- SEGUROS DEL PACIENTE ----------
  registrarSeguro(idUsuario: number, payload: SeguroPayload): Promise<Seguro> {
    return request<Seguro>(`${API_USUARIOS_URL}/${idUsuario}/seguros`, 'POST', payload);
  },

  listarSeguros(idUsuario: number): Promise<Seguro[]> {
    return request<Seguro[]>(`${API_USUARIOS_URL}/${idUsuario}/seguros`);
  },

  eliminarSeguro(idUsuario: number, idSeguro: number): Promise<MessageResponse> {
    return request<MessageResponse>(`${API_USUARIOS_URL}/${idUsuario}/seguros/${idSeguro}`, 'DELETE');
  },

  // ---------- CATÁLOGO ALERGIAS ----------
  crearAlergia(payload: CatalogoPayload): Promise<Catalogo> {
    return request<Catalogo>(API_ALERGIAS_URL, 'POST', payload);
  },

  listarAlergias(): Promise<Catalogo[]> {
    return request<Catalogo[]>(API_ALERGIAS_URL);
  },

  eliminarAlergia(id: number): Promise<MessageResponse> {
    return request<MessageResponse>(`${API_ALERGIAS_URL}/${id}`, 'DELETE');
  },

  // ---------- CATÁLOGO ESPECIALIDADES ----------
  crearEspecialidad(payload: CatalogoPayload): Promise<Catalogo> {
    return request<Catalogo>(API_ESPECIALIDADES_URL, 'POST', payload);
  },

  listarEspecialidades(): Promise<Catalogo[]> {
    return request<Catalogo[]>(API_ESPECIALIDADES_URL);
  },

  eliminarEspecialidad(id: number): Promise<MessageResponse> {
    return request<MessageResponse>(`${API_ESPECIALIDADES_URL}/${id}`, 'DELETE');
  },
};