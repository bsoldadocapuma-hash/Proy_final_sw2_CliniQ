package com.cliniq.cliniq_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private Integer ci;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 150)
    private String nombre;

    private Integer telefono;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(length = 1)
    private String genero;

    @Column(nullable = false, length = 1)
    private String rol;

    @Column(name = "grupo_sanguineo", length = 5)
    private String grupoSanguineo;

    private String direccion;

    @Column(name = "contacto_emergencia")
    private Integer contactoEmergencia;

    @Column(name = "matricula_profesional", length = 50)
    private String matriculaProfesional;

    @Column(name = "estado_disponibilidad")
    private Boolean estadoDisponibilidad = true;

    @Column(name = "link_sala_virtual")
    private String linkSalaVirtual;

    @Column(name = "firma_digital")
    private String firmaDigital;

    @Column(name = "blockchain_pub_key")
    private String blockchainPubKey;

    @Column(name = "foto", columnDefinition = "TEXT")
    private String foto;

    @Column(name = "peso_kg")
    private Double pesoKg;

    @Column(name = "altura_cm")
    private Integer alturaCm;
}