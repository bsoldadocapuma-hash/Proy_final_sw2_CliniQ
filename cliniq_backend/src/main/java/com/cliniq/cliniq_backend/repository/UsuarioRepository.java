package com.cliniq.cliniq_backend.repository;

import com.cliniq.cliniq_backend.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    // ---------- USUARIO ----------
    Optional<Usuario> findByEmail(String email);
    boolean existsByCi(Integer ci);
    boolean existsByEmail(String email);

    // ---------- ALERGIA (catálogo) ----------
    @Query("select a from Alergia a order by a.id")
    List<Alergia> listarAlergias();

    @Query("select a from Alergia a where a.id = :id")
    Optional<Alergia> buscarAlergia(@Param("id") Integer id);

    @Query("select a from Alergia a where lower(a.nombre) = lower(:nombre)")
    Optional<Alergia> buscarAlergiaPorNombre(@Param("nombre") String nombre);

    // ---------- ALERGIA_USUARIO ----------
    @Query("select au.alergia from AlergiaUsuario au where au.usuario.id = :usuarioId order by au.alergia.id")
    List<Alergia> alergiasDeUsuario(@Param("usuarioId") Integer usuarioId);

    @Query("select count(au) from AlergiaUsuario au where au.usuario.id = :usuarioId and au.alergia.id = :alergiaId")
    long contarAlergiaDeUsuario(@Param("usuarioId") Integer usuarioId, @Param("alergiaId") Integer alergiaId);

    @Query("select count(au) from AlergiaUsuario au where au.alergia.id = :alergiaId")
    long contarUsosDeAlergia(@Param("alergiaId") Integer alergiaId);

    @Modifying
    @Query("delete from AlergiaUsuario au where au.usuario.id = :usuarioId and au.alergia.id = :alergiaId")
    void quitarAlergiaDeUsuario(@Param("usuarioId") Integer usuarioId, @Param("alergiaId") Integer alergiaId);

    @Modifying
    @Query("delete from AlergiaUsuario au where au.usuario.id = :usuarioId")
    void borrarAlergiasDeUsuario(@Param("usuarioId") Integer usuarioId);

    // ---------- ESPECIALIDAD (catálogo) ----------
    @Query("select e from Especialidad e order by e.id")
    List<Especialidad> listarEspecialidades();

    @Query("select e from Especialidad e where e.id = :id")
    Optional<Especialidad> buscarEspecialidad(@Param("id") Integer id);

    @Query("select e from Especialidad e where e.id in :ids")
    List<Especialidad> buscarEspecialidadesPorIds(@Param("ids") Collection<Integer> ids);

    @Query("select e from Especialidad e where lower(e.nombre) = lower(:nombre)")
    Optional<Especialidad> buscarEspecialidadPorNombre(@Param("nombre") String nombre);

    // ---------- ESPECIALIDAD_USUARIO ----------
    @Query("select eu.especialidad from EspecialidadUsuario eu where eu.usuario.id = :usuarioId order by eu.especialidad.id")
    List<Especialidad> especialidadesDeUsuario(@Param("usuarioId") Integer usuarioId);

    @Query("select count(eu) from EspecialidadUsuario eu where eu.especialidad.id = :especialidadId")
    long contarUsosDeEspecialidad(@Param("especialidadId") Integer especialidadId);

    @Modifying
    @Query("delete from EspecialidadUsuario eu where eu.usuario.id = :usuarioId")
    void borrarEspecialidadesDeUsuario(@Param("usuarioId") Integer usuarioId);

    // ---------- HORARIO ----------
    @Query("select h from Horario h where h.usuario.id = :usuarioId order by h.id")
    List<Horario> horariosDeUsuario(@Param("usuarioId") Integer usuarioId);

    @Modifying
    @Query("delete from Horario h where h.usuario.id = :usuarioId")
    void borrarHorariosDeUsuario(@Param("usuarioId") Integer usuarioId);

    // ---------- SEGURO ----------
    @Query("select s from Seguro s where s.usuario.id = :usuarioId and s.estado = true " +
           "order by s.esPrincipal desc, s.id asc")
    List<Seguro> listarSegurosActivos(@Param("usuarioId") Integer usuarioId);

    @Query("select s from Seguro s where s.id = :id and s.usuario.id = :usuarioId and s.estado = true")
    Optional<Seguro> buscarSeguroActivo(@Param("id") Integer id, @Param("usuarioId") Integer usuarioId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Seguro s set s.esPrincipal = false where s.usuario.id = :usuarioId")
    void quitarSeguroPrincipal(@Param("usuarioId") Integer usuarioId);

    @Modifying
    @Query("delete from Seguro s where s.usuario.id = :usuarioId")
    void borrarSegurosDeUsuario(@Param("usuarioId") Integer usuarioId);
}