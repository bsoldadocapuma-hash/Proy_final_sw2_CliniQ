package com.cliniq.cliniq_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "seguro")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Seguro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "nombre_aseguradora", nullable = false, length = 150)
    private String nombreAseguradora;

    @Column(name = "numero_poliza", nullable = false, length = 80)
    private String numeroPoliza;

    @Column(name = "tipo_cobertura", length = 80)
    private String tipoCobertura;

    @Column(name = "porcentaje_cobertura")
    private Double porcentajeCobertura;

    private Double copago;

    @Column(name = "fecha_inicio_vigencia")
    private LocalDate fechaInicioVigencia;

    @Column(name = "fecha_fin_vigencia")
    private LocalDate fechaFinVigencia;

    @Column(name = "es_principal", nullable = false)
    private Boolean esPrincipal = false;

    @Column(nullable = false)
    private Boolean estado = true;
}