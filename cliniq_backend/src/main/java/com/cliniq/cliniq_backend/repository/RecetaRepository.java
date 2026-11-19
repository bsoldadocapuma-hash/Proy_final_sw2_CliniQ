package com.cliniq.cliniq_backend.repository;

import com.cliniq.cliniq_backend.model.Receta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RecetaRepository extends JpaRepository<Receta, Integer> {
    Optional<Receta> findByCitaId(Integer citaId);
}
