package com.cliniq.cliniq_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "cita")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Usuario paciente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medico_id")
    private Usuario medico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cita_origen_id")
    private Cita citaOrigen;

    @Column(name = "fecha")
    private LocalDate fecha;

    @Column(name = "hora_inicio")
    private LocalTime horaInicio;

    @Column(name = "hora_fin")
    private LocalTime horaFin;

    @Column(nullable = false, length = 30)
    private String estado = "PENDIENTE";

    @Column(length = 30)
    private String modalidad;

    @Column(name = "link_google_meet")
    private String linkGoogleMeet;

    @Column(name = "descripcion_progreso", columnDefinition = "TEXT")
    private String descripcionProgreso;

    @Column(length = 30)
    private String prioridad;

    @Column(columnDefinition = "TEXT")
    private String motivo;

    @Column(name = "descripcion_triaje", columnDefinition = "TEXT")
    private String descripcionTriaje;
}