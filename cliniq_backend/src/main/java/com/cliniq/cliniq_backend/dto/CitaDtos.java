package com.cliniq.cliniq_backend.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;

public class CitaDtos {

    public record CrearCitaRequest(
            @NotNull Integer pacienteId,
            @NotNull LocalDate fecha,
            @NotBlank String motivo,
            @NotBlank String modalidad,          // "Presencial" | "Virtual"
            String prioridad,                    // opcional (sugerida por triaje)
            String descripcionTriaje,
            Integer medicoId,                    // opcional: si el coordinador la confirma al insertar
            LocalTime horaInicio                 // opcional
    ) {}

    public record ConfirmarCitaRequest(
            @NotNull Integer medicoId,
            @NotNull LocalDate fecha,
            @NotNull LocalTime horaInicio
    ) {}

    public record ReprogramarRequest(@NotNull LocalDate nuevaFecha) {}

    public record CambiarEstadoRequest(@NotBlank String estado) {}

    public record FinalizarRequest(
            @NotBlank String diagnostico,
            String indicacion
    ) {}

    public record CitaResponse(
            Integer id,
            Integer pacienteId, String pacienteNombre,
            Integer medicoId, String medicoNombre,
            LocalDate fecha, LocalTime horaInicio, LocalTime horaFin,
            String estado, String modalidad, String linkGoogleMeet,
            String prioridad, String motivo, String descripcionTriaje,
            String descripcionProgreso, Integer citaOrigenId
    ) {}
}