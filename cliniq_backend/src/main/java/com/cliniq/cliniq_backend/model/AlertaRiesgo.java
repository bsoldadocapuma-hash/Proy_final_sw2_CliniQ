package com.cliniq.cliniq_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "alerta_riesgo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AlertaRiesgo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDate fecha = LocalDate.now();

    @Column(nullable = false)
    private LocalTime hora = LocalTime.now();

    @Column(name = "diagnostico_principal")
    private String diagnosticoPrincipal;

    @Column(name = "nivel_riesgo", length = 30)
    private String nivelRiesgo;

    @Column(name = "probabilidad_maxima")
    private Double probabilidadMaxima;

    @Column(name = "matriz_probabilidades", columnDefinition = "TEXT")
    private String matrizProbabilidades;

    @Column(name = "patrones_detectados", columnDefinition = "TEXT")
    private String patronesDetectados;
}