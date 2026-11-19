const FLASK_API_URL = 'http://127.0.0.1:5000/api'; 

export interface TriajePayload {
  id_usuario: string;
  sintomas: string[];
}

// Interfaz actualizada para coincidir exactamente con tu TriajeController de Flask
export interface TriajeResponse {
  message?: string;
  error?: string;
  registro_atencion?: {
    id_usuario?: string;
    fecha?: string;
    hora_solicitud?: string;
    prioridad_ia?: string;
    nivel_triaje?: number;
    color_triaje?: string;
    categoria_triaje?: string;
    score_confianza_ia?: number;
    estado_paciente?: string;
    area_derivacion_sugerida_ia?: string;
  };
  sintomas_evaluados?: string[];
}

export const triajeService = {
  async evaluarPaciente(payload: TriajePayload): Promise<TriajeResponse> {
    const response = await fetch(`${FLASK_API_URL}/triaje/predecir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al conectar con el motor de IA en Flask');
    }

    return await response.json();
  }
};