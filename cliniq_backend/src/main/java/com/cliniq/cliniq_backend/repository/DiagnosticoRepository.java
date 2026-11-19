package com.cliniq.cliniq_backend.repository;

import com.cliniq.cliniq_backend.model.Diagnostico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiagnosticoRepository extends JpaRepository<Diagnostico, Integer> {

    Optional<Diagnostico> findTopByCitaIdOrderByIdDesc(Integer citaId);

    /** "Historial de diagnósticos" del panel lateral: diagnósticos previos del paciente, del más reciente al más antiguo. */
    List<Diagnostico> findByCitaPacienteIdAndCitaIdNotOrderByCitaFechaDesc(Integer pacienteId, Integer citaId);
}
