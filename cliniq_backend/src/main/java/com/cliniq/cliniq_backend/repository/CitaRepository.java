package com.cliniq.cliniq_backend.repository;

import com.cliniq.cliniq_backend.model.Cita;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CitaRepository extends JpaRepository<Cita, Integer> {

    /** Paso 1 de la pantalla: citas del médico listas para atender, en orden cronológico. */
    List<Cita> findByMedicoIdAndEstadoInOrderByFechaAscHoraInicioAsc(Integer medicoId, Collection<String> estados);

    /** Garantiza que el médico solo opere sobre SUS citas. */
    Optional<Cita> findByIdAndMedicoId(Integer id, Integer medicoId);
}
