package com.cliniq.cliniq_backend.repository;

import com.cliniq.cliniq_backend.model.DetalleReceta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetalleRecetaRepository extends JpaRepository<DetalleReceta, Integer> {
    /** Orden fijo por id: el documento que se hashea debe ser reproducible al verificar. */
    List<DetalleReceta> findByRecetaIdOrderByIdAsc(Integer recetaId);
}
