package com.cliniq.cliniq_backend.repository;

import com.cliniq.cliniq_backend.model.Medicamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicamentoRepository extends JpaRepository<Medicamento, Integer> {
    List<Medicamento> findAllByOrderByNombreAsc();
}
