package com.cliniq.cliniq_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Firma digital del médico (ECDSA P-256).
 * La clave privada NUNCA se guarda en claro: se cifra con AES-GCM usando una clave derivada del PIN (PBKDF2).
 * Sin el PIN del médico el servidor no puede firmar. En producción lo ideal es un KMS/HSM.
 */
@Entity
@Table(name = "firma_medico")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FirmaMedico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "nombre_firma", nullable = false, length = 150)
    private String nombreFirma;

    /** Clave pública X.509 en Base64. */
    @Column(name = "clave_publica", nullable = false, columnDefinition = "TEXT")
    private String clavePublica;

    /** Base64( IV(12 bytes) || AES-GCM(PKCS8 de la clave privada) ). Vacío si la firma fue revocada. */
    @Column(name = "clave_privada_cifrada", nullable = false, columnDefinition = "TEXT")
    private String clavePrivadaCifrada;

    /** Salt de PBKDF2 en Base64. */
    @Column(nullable = false, length = 64)
    private String salt;

    @Column(nullable = false, length = 64)
    private String huella;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean activa = true;
}
