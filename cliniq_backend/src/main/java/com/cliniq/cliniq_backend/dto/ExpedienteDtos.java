package com.cliniq.cliniq_backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/** DTOs de la pantalla "Crear Expediente" y de la firma digital. */
public final class ExpedienteDtos {
    private ExpedienteDtos() {}

    /* ── Paso 1 ── */
    public record CitaResumen(Integer id, Integer pacienteId, String paciente, LocalDate fecha,
                              LocalTime horaInicio, String modalidad, String estado) {}

    /* ── Panel "Contexto del paciente" ── */
    public record SintomaDto(String nombre, String severidad, String descripcion, String observacion) {}
    public record HistorialDto(Integer citaId, LocalDate fecha, String descripcion) {}
    public record ContextoPaciente(Integer citaId, Integer pacienteId, String paciente, String motivo,
                                   String prioridad, String descripcionTriaje,
                                   List<SintomaDto> sintomas, List<HistorialDto> historial) {}

    /* ── Paso 3 ── */
    public record MedicamentoDto(Integer id, String nombre, String formaFarmaceutica, String concentracion) {}
    public record FilaMedicamento(Integer medicamentoId, String dosis, String frecuencia,
                                  String duracion, String viaAdministracion) {}

    /* ── Paso 4: firmar y registrar ── */
    public record EmitirRequest(String diagnostico, String indicacion, List<FilaMedicamento> medicamentos, String pin) {}
    public record EvidenciaDto(Integer id, Integer citaId, String paciente, LocalDate fecha, LocalTime hora,
                               String hashDocumento, String txHashRed, String firma,
                               String resumenReceta, boolean emailEnviado) {}
    public record EnvioDto(boolean enviado, String destinatario, String error) {}
    public record EmitirResponse(EvidenciaDto evidencia, EnvioDto email) {}
    public record VerificacionDto(boolean hashOk, boolean firmaOk) {}

    /* ── Firma digital ── */
    public record CrearFirmaRequest(String nombreFirma, String pin) {}
    public record FirmaDto(Integer id, String nombreFirma, String huella, LocalDateTime fechaCreacion, boolean activa) {}
}
