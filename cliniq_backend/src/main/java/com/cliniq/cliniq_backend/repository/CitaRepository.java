package com.cliniq.cliniq_backend.repository;

import com.cliniq.cliniq_backend.model.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Integer> {

    @Query("""
        SELECT c FROM Cita c
        LEFT JOIN FETCH c.paciente
        LEFT JOIN FETCH c.medico
        WHERE c.paciente.id = :pacienteId
        ORDER BY c.fecha ASC, c.horaInicio ASC
        """)
    List<Cita> findByPaciente(@Param("pacienteId") Integer pacienteId);

    @Query("""
        SELECT c FROM Cita c
        LEFT JOIN FETCH c.paciente
        LEFT JOIN FETCH c.medico
        WHERE c.medico.id = :medicoId AND c.fecha = :fecha
          AND c.estado IN :estados
        ORDER BY c.horaInicio ASC
        """)
    List<Cita> findAgendaMedico(@Param("medicoId") Integer medicoId,
                                @Param("fecha") LocalDate fecha,
                                @Param("estados") Collection<String> estados);

    @Query("""
        SELECT c FROM Cita c
        LEFT JOIN FETCH c.paciente
        LEFT JOIN FETCH c.medico
        WHERE c.estado = 'PENDIENTE'
        ORDER BY CASE c.prioridad WHEN 'ALTA' THEN 1 WHEN 'MEDIA' THEN 2 ELSE 3 END,
                 c.fecha ASC
        """)
    List<Cita> findPendientesPorPrioridad();

    @Query("""
        SELECT c FROM Cita c
        LEFT JOIN FETCH c.paciente
        LEFT JOIN FETCH c.medico
        WHERE c.estado IN :estados
        ORDER BY c.fecha DESC, c.horaInicio DESC
        """)
    List<Cita> findByEstados(@Param("estados") Collection<String> estados);

    @Query("""
        SELECT c FROM Cita c
        LEFT JOIN FETCH c.paciente
        LEFT JOIN FETCH c.medico
        WHERE c.medico.id = :medicoId
          AND c.estado IN :estados
        ORDER BY c.fecha ASC, c.horaInicio ASC
        """)
    List<Cita> findByMedicoYEstados(@Param("medicoId") Integer medicoId,
                                    @Param("estados") Collection<String> estados);

    /** ¿El médico ya tiene una cita activa que se solape con [inicio, fin)? */
    @Query("""
        SELECT COUNT(c) > 0 FROM Cita c
        WHERE c.medico.id = :medicoId AND c.fecha = :fecha
          AND c.estado IN ('CONFIRMADA','EN_CURSO')
          AND c.horaInicio < :fin AND c.horaFin > :inicio
          AND (:excluirId IS NULL OR c.id <> :excluirId)
        """)
    boolean existeSolape(@Param("medicoId") Integer medicoId,
                         @Param("fecha") LocalDate fecha,
                         @Param("inicio") LocalTime inicio,
                         @Param("fin") LocalTime fin,
                         @Param("excluirId") Integer excluirId);

    @Query("""
        SELECT c FROM Cita c
        WHERE c.medico.id = :medicoId AND c.fecha = :fecha
          AND c.estado IN ('CONFIRMADA','EN_CURSO')
        ORDER BY c.horaInicio
        """)
    List<Cita> findOcupadas(@Param("medicoId") Integer medicoId,
                            @Param("fecha") LocalDate fecha);
}