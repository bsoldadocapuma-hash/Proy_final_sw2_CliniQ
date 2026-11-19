package com.cliniq.cliniq_backend.repository;

import com.cliniq.cliniq_backend.model.FirmaMedico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FirmaMedicoRepository extends JpaRepository<FirmaMedico, Integer> {

    Optional<FirmaMedico> findByUsuarioIdAndActivaTrue(Integer usuarioId);

    /** Para mostrar el nombre de la firma en el PDF a partir de la clave pública guardada en la evidencia. */
    Optional<FirmaMedico> findFirstByClavePublica(String clavePublica);

    /** Desactiva las firmas del médico y borra su clave privada cifrada (revocar / reemplazar). */
    @Modifying
    @Query("update FirmaMedico f set f.activa = false, f.clavePrivadaCifrada = '' where f.usuario.id = :usuarioId")
    void revocarTodas(@Param("usuarioId") Integer usuarioId);
}
