package com.cliniq.cliniq_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "triaje")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Triaje {

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

    @Column(length = 30)
    private String prioridad;

    @Column(name = "reglas_aplicadas", columnDefinition = "TEXT")
    private String reglasAplicadas;

    @Column(name = "area_derivacion", length = 100)
    private String areaDerivacion;

    @Column(columnDefinition = "TEXT")
    private String mensaje;
}