package com.cliniq.cliniq_backend.repository;

import com.cliniq.cliniq_backend.model.EvidenciaBlockchain;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EvidenciaBlockchainRepository extends JpaRepository<EvidenciaBlockchain, Integer> {

    Optional<EvidenciaBlockchain> findByCitaId(Integer citaId);

    /** Sección "Expedientes firmados": evidencias de las citas de este médico, las más nuevas primero. */
    List<EvidenciaBlockchain> findByCitaMedicoIdOrderByIdDesc(Integer medicoId);
}
