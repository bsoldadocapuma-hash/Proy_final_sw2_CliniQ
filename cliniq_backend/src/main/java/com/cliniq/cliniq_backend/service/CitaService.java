package com.cliniq.cliniq_backend.service;

import com.cliniq.cliniq_backend.dto.CitaDtos.*;
import com.cliniq.cliniq_backend.model.Cita;
import com.cliniq.cliniq_backend.model.Usuario;
import com.cliniq.cliniq_backend.repository.CitaRepository;
import com.cliniq.cliniq_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CitaService {

    public static final int DURACION_MIN = 30;
    private static final Set<String> ESTADOS_VALIDOS =
            Set.of("PENDIENTE", "CONFIRMADA", "EN_CURSO", "ATENDIDA", "CANCELADA", "RECHAZADA");

    private final CitaRepository citaRepo;
    private final UsuarioRepository usuarioRepo;

    /* ───────────── Crear ───────────── */

    @Transactional
    public CitaResponse crear(CrearCitaRequest req) {
        Usuario paciente = buscarUsuario(req.pacienteId(), "P");

        if (req.fecha().isBefore(LocalDate.now()))
            throw error(HttpStatus.BAD_REQUEST, "La fecha no puede ser anterior a hoy.");

        Cita c = new Cita();
        c.setPaciente(paciente);
        c.setFecha(req.fecha());
        c.setMotivo(req.motivo().trim());
        c.setModalidad(req.modalidad());
        c.setPrioridad(req.prioridad() != null ? req.prioridad().toUpperCase() : "MEDIA");
        c.setDescripcionTriaje(req.descripcionTriaje());
        c.setEstado("PENDIENTE");
        c = citaRepo.save(c);

        // "Insertar y confirmar" (coordinador)
        if (req.medicoId() != null && req.horaInicio() != null) {
            return aResponse(aplicarConfirmacion(c, req.medicoId(), req.fecha(), req.horaInicio()));
        }
        return aResponse(c);
    }

    /* ───────────── Consultas ───────────── */

    @Transactional(readOnly = true)
    public CitaResponse obtener(Integer id) {
        return aResponse(buscar(id));
    }

    @Transactional(readOnly = true)
    public List<CitaResponse> listarPorPaciente(Integer pacienteId) {
        return citaRepo.findByPaciente(pacienteId).stream().map(this::aResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CitaResponse> listarPendientes() {
        return citaRepo.findPendientesPorPrioridad().stream().map(this::aResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CitaResponse> listarConfirmadas(Integer medicoId) {
        var estados = List.of("CONFIRMADA", "EN_CURSO");
        var lista = (medicoId == null)
                ? citaRepo.findByEstados(estados)
                : citaRepo.findByMedicoYEstados(medicoId, estados);
        return lista.stream().map(this::aResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CitaResponse> listarCerradas() {
        return citaRepo.findByEstados(List.of("ATENDIDA", "CANCELADA", "RECHAZADA"))
                .stream().map(this::aResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CitaResponse> agendaMedico(Integer medicoId, LocalDate fecha) {
        return citaRepo.findAgendaMedico(medicoId, fecha, List.of("CONFIRMADA", "EN_CURSO", "ATENDIDA"))
                .stream().map(this::aResponse).toList();
    }

    /** Horas de inicio ya ocupadas por el médico en esa fecha. */
    @Transactional(readOnly = true)
    public List<LocalTime> horasOcupadas(Integer medicoId, LocalDate fecha) {
        return citaRepo.findOcupadas(medicoId, fecha).stream().map(Cita::getHoraInicio).toList();
    }

    /* ───────────── Flujo del coordinador ───────────── */

    @Transactional
    public CitaResponse confirmar(Integer id, ConfirmarCitaRequest req) {
        Cita c = buscar(id);
        if (!"PENDIENTE".equals(c.getEstado()))
            throw error(HttpStatus.CONFLICT, "Solo se pueden confirmar citas pendientes.");
        return aResponse(aplicarConfirmacion(c, req.medicoId(), req.fecha(), req.horaInicio()));
    }

    @Transactional
    public CitaResponse rechazar(Integer id) {
        Cita c = buscar(id);
        if (!"PENDIENTE".equals(c.getEstado()))
            throw error(HttpStatus.CONFLICT, "Solo se pueden rechazar citas pendientes.");
        c.setEstado("RECHAZADA");
        return aResponse(c);
    }

    /* ───────────── Cancelar / Reprogramar ───────────── */

    @Transactional
    public CitaResponse cancelar(Integer id) {
        Cita c = buscar(id);
        if (!Set.of("PENDIENTE", "CONFIRMADA").contains(c.getEstado()))
            throw error(HttpStatus.CONFLICT, "Esta cita ya no se puede cancelar.");
        c.setEstado("CANCELADA");
        return aResponse(c);
    }

    /** La cita vuelve a la cola del coordinador para reasignar médico y hora. */
    @Transactional
    public CitaResponse reprogramar(Integer id, ReprogramarRequest req) {
        Cita c = buscar(id);
        if (!Set.of("PENDIENTE", "CONFIRMADA").contains(c.getEstado()))
            throw error(HttpStatus.CONFLICT, "Esta cita ya no se puede reprogramar.");
        if (req.nuevaFecha().isBefore(LocalDate.now()))
            throw error(HttpStatus.BAD_REQUEST, "La nueva fecha no puede ser anterior a hoy.");

        c.setFecha(req.nuevaFecha());
        c.setMedico(null);
        c.setHoraInicio(null);
        c.setHoraFin(null);
        c.setLinkGoogleMeet(null);
        c.setEstado("PENDIENTE");
        return aResponse(c);
    }

    /* ───────────── Flujo del médico ───────────── */

    @Transactional
    public CitaResponse cambiarEstado(Integer id, String nuevoEstado) {
        String estado = nuevoEstado.toUpperCase();
        if (!ESTADOS_VALIDOS.contains(estado))
            throw error(HttpStatus.BAD_REQUEST, "Estado no válido: " + nuevoEstado);

        Cita c = buscar(id);
        if ("EN_CURSO".equals(estado) && !"CONFIRMADA".equals(c.getEstado()))
            throw error(HttpStatus.CONFLICT, "Solo se puede iniciar una cita confirmada.");
        c.setEstado(estado);
        return aResponse(c);
    }

    @Transactional
    public CitaResponse finalizar(Integer id, FinalizarRequest req) {
        Cita c = buscar(id);
        if (!"EN_CURSO".equals(c.getEstado()))
            throw error(HttpStatus.CONFLICT, "La consulta debe estar en curso para finalizarla.");

        String progreso = "Diagnóstico: " + req.diagnostico().trim();
        if (req.indicacion() != null && !req.indicacion().isBlank())
            progreso += "\nIndicaciones: " + req.indicacion().trim();
        c.setDescripcionProgreso(progreso);
        c.setEstado("ATENDIDA");
        // TODO: aquí se crearía la Receta + DetalleReceta cuando exista esa entidad
        return aResponse(c);
    }

    /* ───────────── Helpers ───────────── */

    private Cita aplicarConfirmacion(Cita c, Integer medicoId, LocalDate fecha, LocalTime inicio) {
        Usuario medico = buscarUsuario(medicoId, "M");
        LocalTime fin = inicio.plusMinutes(DURACION_MIN);

        if (Boolean.FALSE.equals(medico.getEstadoDisponibilidad()))
            throw error(HttpStatus.CONFLICT, "El médico no está disponible.");
        if (citaRepo.existeSolape(medicoId, fecha, inicio, fin, c.getId()))
            throw error(HttpStatus.CONFLICT, "Ese horario ya está ocupado para el médico.");

        c.setMedico(medico);
        c.setFecha(fecha);
        c.setHoraInicio(inicio);
        c.setHoraFin(fin);
        c.setEstado("CONFIRMADA");
        if ("Virtual".equalsIgnoreCase(c.getModalidad()))
            c.setLinkGoogleMeet(medico.getLinkSalaVirtual());
        return c;
    }

    private Cita buscar(Integer id) {
        return citaRepo.findById(id)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Cita no encontrada: " + id));
    }

    private Usuario buscarUsuario(Integer id, String rolEsperado) {
        Usuario u = usuarioRepo.findById(id)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Usuario no encontrado: " + id));
        if (!rolEsperado.equals(u.getRol()))
            throw error(HttpStatus.BAD_REQUEST, "El usuario " + id + " no tiene el rol requerido.");
        return u;
    }

    private ResponseStatusException error(HttpStatus status, String msg) {
        return new ResponseStatusException(status, msg);
    }

    private CitaResponse aResponse(Cita c) {
        Usuario p = c.getPaciente(), m = c.getMedico();
        return new CitaResponse(
                c.getId(),
                p.getId(), p.getNombre(),
                m != null ? m.getId() : null, m != null ? m.getNombre() : null,
                c.getFecha(), c.getHoraInicio(), c.getHoraFin(),
                c.getEstado(), c.getModalidad(), c.getLinkGoogleMeet(),
                c.getPrioridad(), c.getMotivo(), c.getDescripcionTriaje(),
                c.getDescripcionProgreso(),
                c.getCitaOrigen() != null ? c.getCitaOrigen().getId() : null
        );
    }
}