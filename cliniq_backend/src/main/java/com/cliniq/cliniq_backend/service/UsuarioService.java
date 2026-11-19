package com.cliniq.cliniq_backend.service;

import com.cliniq.cliniq_backend.model.*;
import com.cliniq.cliniq_backend.repository.UsuarioRepository;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    // =====================================================
    // DTOs (requests)
    // =====================================================
    public record LoginDto(@NotBlank @Email String email, @NotBlank String password) {}

    public record HorarioDto(
            @NotBlank @Size(max = 15) String dia,
            @NotNull LocalTime horaInicio,
            @NotNull LocalTime horaFin,
            @Size(max = 30) String tipoTurno) {}

    public record CreatePacienteDto(
            @NotNull Integer ci,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            @NotBlank String nombre,
            Integer telefono,
            @NotNull LocalDate fechaNacimiento,
            @Size(max = 1) String genero,
            @Size(max = 5) String grupoSanguineo,
            String direccion,
            Integer contactoEmergencia,
            Double pesoKg,
            Integer alturaCm) {}

    public record CreateMedicoDto(
            @NotNull Integer ci,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            @NotBlank String nombre,
            Integer telefono,
            @NotNull LocalDate fechaNacimiento,
            @Size(max = 1) String genero,
            String direccion,
            @NotBlank @Size(max = 50) String matriculaProfesional,
            String linkSalaVirtual,
            String firmaDigital,
            String blockchainPubKey,
            String foto,
            @NotEmpty List<Integer> especialidadIds,
            @NotEmpty @Valid List<HorarioDto> horarios) {}

    public record CreateCoordinadorDto(
            @NotNull Integer ci,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            @NotBlank String nombre,
            Integer telefono,
            @NotNull LocalDate fechaNacimiento,
            @Size(max = 1) String genero,
            String direccion,
            @NotEmpty @Valid List<HorarioDto> horarios) {}

    public record RecuperarPasswordDto(
            @NotBlank @Email String email,
            @NotBlank String passwordActual,
            @NotBlank @Size(min = 6) String nuevaPassword) {}

    /** Perfil paciente: solo datos de usuario. Los campos null no se modifican. */
    public record UpdatePacienteDto(
            String nombre,
            Integer telefono,
            String direccion,
            @Size(max = 5) String grupoSanguineo,
            Integer contactoEmergencia,
            Double pesoKg,
            Integer alturaCm) {}

    /** Perfil médico: datos + especialidades + horarios. Los campos null no se modifican. */
    public record UpdateMedicoDto(
            String nombre,
            Integer telefono,
            String direccion,
            @Size(max = 50) String matriculaProfesional,
            String linkSalaVirtual,
            String foto,
            Boolean estadoDisponibilidad,
            List<Integer> especialidadIds,          // si se envía, reemplaza todas
            @Valid List<HorarioDto> horarios) {}    // si se envía, reemplaza todos

    /** Perfil coordinador: datos + horarios. Los campos null no se modifican. */
    public record UpdateCoordinadorDto(
            String nombre,
            Integer telefono,
            String direccion,
            @Valid List<HorarioDto> horarios) {}    // si se envía, reemplaza todos

    public record CreateSeguroDto(
            @NotBlank String nombreAseguradora,
            @NotBlank String numeroPoliza,
            String tipoCobertura,
            Double porcentajeCobertura,
            Double copago,
            @NotNull LocalDate fechaInicioVigencia,
            @NotNull LocalDate fechaFinVigencia,
            Boolean esPrincipal) {}

    /** Request para crear alergia o especialidad. */
    public record CatalogoDto(@NotBlank @Size(max = 100) String nombre) {}

    // =====================================================
    // DTOs (responses)
    // =====================================================
    public record CatalogoResponse(Integer id, String nombre) {}

    public record HorarioResponse(Integer id, String dia, LocalTime horaInicio,
                                  LocalTime horaFin, String tipoTurno) {
        static HorarioResponse from(Horario h) {
            return new HorarioResponse(h.getId(), h.getDia(), h.getHoraInicio(),
                    h.getHoraFin(), h.getTipoTurno());
        }
    }

    public record SeguroResponse(Integer id, String nombreAseguradora, String numeroPoliza,
                                 String tipoCobertura, Double porcentajeCobertura, Double copago,
                                 LocalDate fechaInicioVigencia, LocalDate fechaFinVigencia,
                                 Boolean esPrincipal) {
        static SeguroResponse from(Seguro s) {
            return new SeguroResponse(s.getId(), s.getNombreAseguradora(), s.getNumeroPoliza(),
                    s.getTipoCobertura(), s.getPorcentajeCobertura(), s.getCopago(),
                    s.getFechaInicioVigencia(), s.getFechaFinVigencia(), s.getEsPrincipal());
        }
    }

    public record UsuarioResponse(Integer id, Integer ci, String email, String nombre,
                                  Integer telefono, LocalDate fechaNacimiento, String genero,
                                  String rol, String grupoSanguineo, String direccion,
                                  Integer contactoEmergencia, String matriculaProfesional,
                                  Boolean estadoDisponibilidad, String linkSalaVirtual,
                                  String foto, Double pesoKg, Integer alturaCm) {
        static UsuarioResponse from(Usuario u) {
            return new UsuarioResponse(u.getId(), u.getCi(), u.getEmail(), u.getNombre(),
                    u.getTelefono(), u.getFechaNacimiento(), u.getGenero(), u.getRol(),
                    u.getGrupoSanguineo(), u.getDireccion(), u.getContactoEmergencia(),
                    u.getMatriculaProfesional(), u.getEstadoDisponibilidad(), u.getLinkSalaVirtual(),
                    u.getFoto(), u.getPesoKg(), u.getAlturaCm());
        }
    }

    /** Los campos null no aparecen en el JSON, así cada rol ve solo lo suyo. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UsuarioDetalleResponse(UsuarioResponse usuario,
                                         List<CatalogoResponse> alergias,
                                         List<SeguroResponse> seguros,
                                         List<CatalogoResponse> especialidades,
                                         List<HorarioResponse> horarios) {}

    public record LoginResponse(String message, String accessToken, UsuarioDetalleResponse user) {}

    // =====================================================
    // Dependencias
    // =====================================================
    private final UsuarioRepository repo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PersistenceContext
    private EntityManager em;

    // =====================================================
    // 1. LOGIN
    //    P -> solo usuario | M -> usuario + horarios + especialidades | C -> usuario + horarios
    // =====================================================
    @Transactional(readOnly = true)
    public LoginResponse login(LoginDto dto) {
        Usuario user = repo.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));

        if (!passwordEncoder.matches(dto.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
        }

        String token = jwtService.generarToken(user);
        return new LoginResponse("Inicio de sesión exitoso", token, detalle(user, false));
    }

    // =====================================================
    // 2. REGISTRO DE PACIENTE (sin alergias: se asignan después por separado)
    // =====================================================
    @Transactional
    public UsuarioResponse registrarPaciente(CreatePacienteDto dto) {
        verificarDuplicados(dto.ci(), dto.email());

        Usuario u = nuevoUsuario(dto.ci(), dto.email(), dto.password(), dto.nombre(),
                dto.telefono(), dto.fechaNacimiento(), dto.genero(), dto.direccion(), "P");
        u.setGrupoSanguineo(dto.grupoSanguineo());
        u.setContactoEmergencia(dto.contactoEmergencia());
        u.setPesoKg(dto.pesoKg());
        u.setAlturaCm(dto.alturaCm());

        return UsuarioResponse.from(repo.save(u));
    }

    // =====================================================
    // 3. REGISTRO DE MÉDICO (+ especialidades y horarios)
    // =====================================================
    @Transactional
    public UsuarioResponse registrarMedico(CreateMedicoDto dto) {
        verificarDuplicados(dto.ci(), dto.email());
        List<Especialidad> especialidades = cargarEspecialidades(dto.especialidadIds());
        validarHorarios(dto.horarios());

        Usuario u = nuevoUsuario(dto.ci(), dto.email(), dto.password(), dto.nombre(),
                dto.telefono(), dto.fechaNacimiento(), dto.genero(), dto.direccion(), "M");
        u.setMatriculaProfesional(dto.matriculaProfesional());
        u.setLinkSalaVirtual(dto.linkSalaVirtual());
        u.setFirmaDigital(dto.firmaDigital());
        u.setBlockchainPubKey(dto.blockchainPubKey());
        u.setFoto(dto.foto());
        u = repo.save(u);

        for (Especialidad e : especialidades) {
            em.persist(new EspecialidadUsuario(null, u, e));
        }
        guardarHorarios(u, dto.horarios());
        return UsuarioResponse.from(u);
    }

    // =====================================================
    // 4. REGISTRO DE COORDINADOR (+ horarios)
    // =====================================================
    @Transactional
    public UsuarioResponse registrarCoordinador(CreateCoordinadorDto dto) {
        verificarDuplicados(dto.ci(), dto.email());
        validarHorarios(dto.horarios());

        Usuario u = nuevoUsuario(dto.ci(), dto.email(), dto.password(), dto.nombre(),
                dto.telefono(), dto.fechaNacimiento(), dto.genero(), dto.direccion(), "C");
        u = repo.save(u);

        guardarHorarios(u, dto.horarios());
        return UsuarioResponse.from(u);
    }

    // =====================================================
    // 5. CAMBIAR CONTRASEÑA
    // =====================================================
    @Transactional
    public Map<String, String> cambiarPassword(RecuperarPasswordDto dto) {
        Usuario user = repo.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe un usuario con este correo electrónico"));

        if (!passwordEncoder.matches(dto.passwordActual(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "La contraseña actual es incorrecta");
        }

        user.setPasswordHash(passwordEncoder.encode(dto.nuevaPassword()));
        repo.save(user);
        return Map.of("message", "Contraseña actualizada correctamente");
    }

    // =====================================================
    // 6. LISTAR USUARIOS
    //    P -> alergias + seguros | M -> horarios + especialidades | C -> horarios
    // =====================================================
    @Transactional(readOnly = true)
    public List<UsuarioDetalleResponse> listarUsuarios() {
        return repo.findAll().stream().map(u -> detalle(u, true)).toList();
    }

    // =====================================================
    // 7. ELIMINAR USUARIO
    // =====================================================
    @Transactional
    public Map<String, String> eliminarUsuario(Integer id) {
        Usuario user = buscarUsuario(id);

        repo.borrarAlergiasDeUsuario(id);
        repo.borrarEspecialidadesDeUsuario(id);
        repo.borrarHorariosDeUsuario(id);
        repo.borrarSegurosDeUsuario(id);
        repo.delete(user);

        return Map.of("message", "Usuario con ID " + id + " eliminado exitosamente");
    }

    // =====================================================
    // MODIFICAR PERFIL: PACIENTE (solo datos de usuario)
    // =====================================================
    @Transactional
    public UsuarioDetalleResponse modificarPerfilPaciente(Integer id, UpdatePacienteDto dto) {
        Usuario u = obtenerConRol(id, "P", "paciente");

        aplicarDatosBasicos(u, dto.nombre(), dto.telefono(), dto.direccion());
        if (dto.grupoSanguineo() != null) u.setGrupoSanguineo(dto.grupoSanguineo());
        if (dto.contactoEmergencia() != null) u.setContactoEmergencia(dto.contactoEmergencia());
        if (dto.pesoKg() != null) u.setPesoKg(dto.pesoKg());
        if (dto.alturaCm() != null) u.setAlturaCm(dto.alturaCm());

        repo.save(u);
        return detalle(u, false);
    }

    // =====================================================
    // MODIFICAR PERFIL: MÉDICO (datos + especialidades + horarios)
    // =====================================================
    @Transactional
    public UsuarioDetalleResponse modificarPerfilMedico(Integer id, UpdateMedicoDto dto) {
        Usuario u = obtenerConRol(id, "M", "médico");

        // Validar antes de tocar nada
        List<Especialidad> nuevasEspecialidades = null;
        if (dto.especialidadIds() != null) {
            if (dto.especialidadIds().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El médico debe tener al menos una especialidad");
            }
            nuevasEspecialidades = cargarEspecialidades(dto.especialidadIds());
        }
        if (dto.horarios() != null) {
            if (dto.horarios().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El médico debe tener al menos un horario");
            }
            validarHorarios(dto.horarios());
        }

        aplicarDatosBasicos(u, dto.nombre(), dto.telefono(), dto.direccion());
        if (dto.matriculaProfesional() != null) u.setMatriculaProfesional(dto.matriculaProfesional());
        if (dto.linkSalaVirtual() != null) u.setLinkSalaVirtual(dto.linkSalaVirtual());
        if (dto.foto() != null) u.setFoto(dto.foto());
        if (dto.estadoDisponibilidad() != null) u.setEstadoDisponibilidad(dto.estadoDisponibilidad());
        repo.save(u);

        if (nuevasEspecialidades != null) {
            repo.borrarEspecialidadesDeUsuario(id);
            for (Especialidad e : nuevasEspecialidades) {
                em.persist(new EspecialidadUsuario(null, u, e));
            }
        }
        if (dto.horarios() != null) {
            repo.borrarHorariosDeUsuario(id);
            guardarHorarios(u, dto.horarios());
        }

        return detalle(u, false);
    }

    // =====================================================
    // MODIFICAR PERFIL: COORDINADOR (datos + horarios)
    // =====================================================
    @Transactional
    public UsuarioDetalleResponse modificarPerfilCoordinador(Integer id, UpdateCoordinadorDto dto) {
        Usuario u = obtenerConRol(id, "C", "coordinador");

        if (dto.horarios() != null) {
            if (dto.horarios().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El coordinador debe tener al menos un horario");
            }
            validarHorarios(dto.horarios());
        }

        aplicarDatosBasicos(u, dto.nombre(), dto.telefono(), dto.direccion());
        repo.save(u);

        if (dto.horarios() != null) {
            repo.borrarHorariosDeUsuario(id);
            guardarHorarios(u, dto.horarios());
        }

        return detalle(u, false);
    }

    // =====================================================
    // ALERGIAS DEL PACIENTE
    // =====================================================
    @Transactional
    public CatalogoResponse agregarAlergiaAPaciente(Integer idUsuario, Integer idAlergia) {
        Usuario u = obtenerConRol(idUsuario, "P", "paciente");
        Alergia a = buscarAlergia(idAlergia);

        if (repo.contarAlergiaDeUsuario(idUsuario, idAlergia) == 0) {
            em.persist(new AlergiaUsuario(null, u, a));
        }
        return new CatalogoResponse(a.getId(), a.getNombre());
    }

    @Transactional(readOnly = true)
    public List<CatalogoResponse> obtenerAlergiasDePaciente(Integer idUsuario) {
        buscarUsuario(idUsuario);
        return repo.alergiasDeUsuario(idUsuario).stream()
                .map(a -> new CatalogoResponse(a.getId(), a.getNombre())).toList();
    }

    @Transactional
    public Map<String, String> quitarAlergiaDePaciente(Integer idUsuario, Integer idAlergia) {
        if (repo.contarAlergiaDeUsuario(idUsuario, idAlergia) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El paciente no tiene esa alergia");
        }
        repo.quitarAlergiaDeUsuario(idUsuario, idAlergia);
        return Map.of("message", "Alergia eliminada del perfil");
    }

    // =====================================================
    // SEGUROS (registrar, listar, eliminar)
    // =====================================================
    @Transactional
    public SeguroResponse registrarSeguro(Integer idUsuario, CreateSeguroDto dto) {
        Usuario u = obtenerConRol(idUsuario, "P", "paciente");

        if (dto.fechaFinVigencia().isBefore(dto.fechaInicioVigencia())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha fin de vigencia no puede ser anterior a la de inicio");
        }

        boolean principal = Boolean.TRUE.equals(dto.esPrincipal());
        if (principal) {
            repo.quitarSeguroPrincipal(idUsuario);
        }

        Seguro s = new Seguro();
        s.setUsuario(em.getReference(Usuario.class, u.getId()));
        s.setNombreAseguradora(dto.nombreAseguradora());
        s.setNumeroPoliza(dto.numeroPoliza());
        s.setTipoCobertura(dto.tipoCobertura());
        s.setPorcentajeCobertura(dto.porcentajeCobertura());
        s.setCopago(dto.copago());
        s.setFechaInicioVigencia(dto.fechaInicioVigencia());
        s.setFechaFinVigencia(dto.fechaFinVigencia());
        s.setEsPrincipal(principal);
        s.setEstado(true);
        em.persist(s);

        return SeguroResponse.from(s);
    }

    @Transactional(readOnly = true)
    public List<SeguroResponse> listarSeguros(Integer idUsuario) {
        buscarUsuario(idUsuario);
        return repo.listarSegurosActivos(idUsuario).stream().map(SeguroResponse::from).toList();
    }

    /** Baja lógica: estado = false. */
    @Transactional
    public Map<String, String> eliminarSeguro(Integer idUsuario, Integer idSeguro) {
        Seguro s = repo.buscarSeguroActivo(idSeguro, idUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Seguro no encontrado o no pertenece al usuario"));
        s.setEstado(false);
        s.setEsPrincipal(false);
        return Map.of("message", "Seguro eliminado correctamente");
    }

    // =====================================================
    // CATÁLOGO ALERGIA (crear, listar, eliminar)
    // =====================================================
    @Transactional
    public CatalogoResponse crearAlergia(CatalogoDto dto) {
        String nombre = dto.nombre().trim();
        if (repo.buscarAlergiaPorNombre(nombre).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La alergia ya existe");
        }
        Alergia a = new Alergia();
        a.setNombre(nombre);
        em.persist(a);
        return new CatalogoResponse(a.getId(), a.getNombre());
    }

    @Transactional(readOnly = true)
    public List<CatalogoResponse> listarAlergias() {
        return repo.listarAlergias().stream()
                .map(a -> new CatalogoResponse(a.getId(), a.getNombre())).toList();
    }

    @Transactional
    public Map<String, String> eliminarAlergia(Integer id) {
        Alergia a = buscarAlergia(id);
        if (repo.contarUsosDeAlergia(id) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar: la alergia está asignada a uno o más pacientes");
        }
        em.remove(a);
        return Map.of("message", "Alergia eliminada correctamente");
    }

    // =====================================================
    // CATÁLOGO ESPECIALIDAD (crear, listar, eliminar)
    // =====================================================
    @Transactional
    public CatalogoResponse crearEspecialidad(CatalogoDto dto) {
        String nombre = dto.nombre().trim();
        if (repo.buscarEspecialidadPorNombre(nombre).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La especialidad ya existe");
        }
        Especialidad e = new Especialidad();
        e.setNombre(nombre);
        em.persist(e);
        return new CatalogoResponse(e.getId(), e.getNombre());
    }

    @Transactional(readOnly = true)
    public List<CatalogoResponse> listarEspecialidades() {
        return repo.listarEspecialidades().stream()
                .map(e -> new CatalogoResponse(e.getId(), e.getNombre())).toList();
    }

    @Transactional
    public Map<String, String> eliminarEspecialidad(Integer id) {
        Especialidad e = buscarEspecialidad(id);
        if (repo.contarUsosDeEspecialidad(id) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar: la especialidad está asignada a uno o más médicos");
        }
        em.remove(e);
        return Map.of("message", "Especialidad eliminada correctamente");
    }

    // =====================================================
    // HELPERS PRIVADOS
    // =====================================================

    /** Arma la respuesta según el rol. incluirExtrasPaciente=true agrega alergias y seguros. */
    private UsuarioDetalleResponse detalle(Usuario u, boolean incluirExtrasPaciente) {
        UsuarioResponse base = UsuarioResponse.from(u);

        switch (u.getRol()) {
            case "P" -> {
                if (!incluirExtrasPaciente) {
                    return new UsuarioDetalleResponse(base, null, null, null, null);
                }
                return new UsuarioDetalleResponse(base,
                        repo.alergiasDeUsuario(u.getId()).stream()
                                .map(a -> new CatalogoResponse(a.getId(), a.getNombre())).toList(),
                        repo.listarSegurosActivos(u.getId()).stream().map(SeguroResponse::from).toList(),
                        null, null);
            }
            case "M" -> {
                return new UsuarioDetalleResponse(base, null, null,
                        repo.especialidadesDeUsuario(u.getId()).stream()
                                .map(e -> new CatalogoResponse(e.getId(), e.getNombre())).toList(),
                        repo.horariosDeUsuario(u.getId()).stream().map(HorarioResponse::from).toList());
            }
            case "C" -> {
                return new UsuarioDetalleResponse(base, null, null, null,
                        repo.horariosDeUsuario(u.getId()).stream().map(HorarioResponse::from).toList());
            }
            default -> {
                return new UsuarioDetalleResponse(base, null, null, null, null);
            }
        }
    }

    private void aplicarDatosBasicos(Usuario u, String nombre, Integer telefono, String direccion) {
        if (nombre != null && !nombre.isBlank()) u.setNombre(nombre.trim());
        if (telefono != null) u.setTelefono(telefono);
        if (direccion != null) u.setDireccion(direccion);
    }

    private Usuario nuevoUsuario(Integer ci, String email, String password, String nombre,
                                 Integer telefono, LocalDate fechaNac, String genero,
                                 String direccion, String rol) {
        Usuario u = new Usuario();
        u.setCi(ci);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode(password));
        u.setNombre(nombre);
        u.setTelefono(telefono);
        u.setFechaNacimiento(fechaNac);
        u.setGenero(genero);
        u.setDireccion(direccion);
        u.setRol(rol);
        return u;
    }

    private void verificarDuplicados(Integer ci, String email) {
        if (repo.existsByCi(ci) || repo.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El CI o el correo electrónico ya se encuentran registrados");
        }
    }

    private Usuario buscarUsuario(Integer id) {
        return repo.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario con ID " + id + " no encontrado"));
    }

    private Usuario obtenerConRol(Integer id, String rol, String nombreRol) {
        Usuario u = buscarUsuario(id);
        if (!rol.equals(u.getRol())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario no es un " + nombreRol);
        }
        return u;
    }

    private Alergia buscarAlergia(Integer id) {
        return repo.buscarAlergia(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Alergia no encontrada"));
    }

    private Especialidad buscarEspecialidad(Integer id) {
        return repo.buscarEspecialidad(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Especialidad no encontrada"));
    }

    private List<Especialidad> cargarEspecialidades(List<Integer> ids) {
        Set<Integer> unicos = new LinkedHashSet<>(ids);
        List<Especialidad> encontradas = repo.buscarEspecialidadesPorIds(unicos);
        if (encontradas.size() != unicos.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Una o más especialidades no existen");
        }
        return encontradas;
    }

    private void validarHorarios(List<HorarioDto> horarios) {
        for (HorarioDto h : horarios) {
            if (!h.horaFin().isAfter(h.horaInicio())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "En el horario del día " + h.dia() + " la hora fin debe ser posterior a la hora inicio");
            }
        }
    }

    private void guardarHorarios(Usuario u, List<HorarioDto> horarios) {
        for (HorarioDto h : horarios) {
            Horario hor = new Horario();
            hor.setUsuario(u);
            hor.setDia(h.dia());
            hor.setHoraInicio(h.horaInicio());
            hor.setHoraFin(h.horaFin());
            hor.setTipoTurno(h.tipoTurno());
            em.persist(hor);
        }
    }
}