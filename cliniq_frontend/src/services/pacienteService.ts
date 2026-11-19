// src/services/pacienteService.ts
const API_URL = 'http://localhost:3000/usuarios';

export const pacienteService = {
  getHeaders() {
    const token = localStorage.getItem('cliniq_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  },

  // --- PERFIL ---
  async modificarPerfil(idUsuario: number, datos: any) {
    const response = await fetch(`${API_URL}/${idUsuario}/perfil`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(datos),
    });
    if (!response.ok) throw new Error('Error al actualizar el perfil');
    return await response.json();
  },

  // --- ALERGIAS ---
  async obtenerAlergias(idUsuario: number) {
    const response = await fetch(`${API_URL}/${idUsuario}/alergias`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Error al obtener alergias');
    return await response.json();
  },

  async agregarAlergia(idUsuario: number, nombreAlergia: string) {
    const response = await fetch(`${API_URL}/${idUsuario}/alergias`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ nombre: nombreAlergia }), 
    });
    if (!response.ok) throw new Error('Error al agregar alergia');
    return await response.json();
  },

  async eliminarAlergia(idUsuario: number, idAlergia: number) {
    const response = await fetch(`${API_URL}/${idUsuario}/alergias/${idAlergia}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Error al eliminar alergia');
    return await response.json();
  },

  // --- SEGUROS ---
  async listarSeguros(idUsuario: number) {
    const response = await fetch(`${API_URL}/${idUsuario}/seguros`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Error al listar seguros');
    return await response.json();
  },

  async registrarSeguro(idUsuario: number, seguro: any) {
    const response = await fetch(`${API_URL}/${idUsuario}/seguros`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(seguro),
    });
    if (!response.ok) throw new Error('Error al registrar seguro');
    return await response.json();
  },

  async eliminarSeguro(idUsuario: number, idSeguro: number) {
    const response = await fetch(`${API_URL}/${idUsuario}/seguros/${idSeguro}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Error al eliminar seguro');
    return await response.json();
  },

  async definirSeguroPrincipal(idUsuario: number, idSeguro: number) {
    const response = await fetch(`${API_URL}/${idUsuario}/seguros/${idSeguro}/principal`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Error al actualizar el seguro principal');
    return await response.json();
  }
};