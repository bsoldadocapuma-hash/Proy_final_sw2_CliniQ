package com.cliniq.cliniq_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "evidencia_blockchain")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EvidenciaBlockchain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cita_id", nullable = false, unique = true)
    private Cita cita;

    @Column(name = "hash_documento", nullable = false)
    private String hashDocumento;

    @Column(name = "tx_hash_red")
    private String txHashRed;

    @Column(nullable = false)
    private LocalDate fecha = LocalDate.now();

    @Column(nullable = false)
    private LocalTime hora = LocalTime.now();

    @Column(name = "medico_pub_key")
    private String medicoPubKey;
}