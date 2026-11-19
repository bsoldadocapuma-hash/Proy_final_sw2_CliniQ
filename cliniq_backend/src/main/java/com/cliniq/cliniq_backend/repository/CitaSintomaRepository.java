package com.cliniq.cliniq_backend.repository;

import com.cliniq.cliniq_backend.model.CitaSintoma;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CitaSintomaRepository extends JpaRepository<CitaSintoma, Integer> {
    List<CitaSintoma> findByCitaId(Integer citaId);
}
