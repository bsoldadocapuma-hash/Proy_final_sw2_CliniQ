package com.cliniq.cliniq_backend.service;

import com.cliniq.cliniq_backend.dto.ExpedienteDtos.*;
import com.cliniq.cliniq_backend.model.*;
import com.cliniq.cliniq_backend.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.PrivateKey;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/** Lógica de la pantalla "Crear Expediente": contexto, emitir (diagnóstico + receta + firma + evidencia) y verificar. */
@Service
@RequiredArgsConstructor
public class ExpedienteService {

    /** Estados en que una cita se puede documentar. Ajusta si tu BD usa otros textos. */
    public static final List<String> ESTADOS_ATENDIBLES = List.of("CONFIRMADA", "EN_CURSO");
    public static final String ESTADO_ATENDIDA = "ATENDIDA";

    private final CitaRepository citas;
    private final CitaSintomaRepository citaSintomas;
    private final DiagnosticoRepository diagnosticos;
    private final RecetaRepository recetas;
    private final DetalleRecetaRepository detalles;
    private final MedicamentoRepository medicamentos;
    private final EvidenciaBlockchainRepository evidencias;
    private final FirmaMedicoService firmas;
    private final ObjectMapper mapper;

    /* ───────────── Paso 1: citas por atender ───────────── */
    @Transactional(readOnly = true)
    public List<CitaResumen> citasPorAtender(Integer medicoId) {
        return citas.findByMedicoIdAndEstadoInOrderByFechaAscHoraInicioAsc(medicoId, ESTADOS_ATENDIBLES).stream()
                .map(c -> new CitaResumen(c.getId(), c.getPaciente().getId(), c.getPaciente().getNombre(),
                        c.getFecha(), c.getHoraInicio(), c.getModalidad(), c.getEstado()))
                .toList();
    }

    /* ───────────── Panel "Contexto del paciente" ───────────── */
    @Transactional(readOnly = true)
    public ContextoPaciente contexto(Integer medicoId, Integer citaId) {
        Cita c = citaDelMedico(medicoId, citaId);
        List<SintomaDto> sint = citaSintomas.findByCitaId(citaId).stream()
                .map(s -> new SintomaDto(s.getSintoma().getNombre(), s.getSeveridad(), s.getDescripcion(), s.getObservacion()))
                .toList();
        List<HistorialDto> hist = diagnosticos
                .findByCitaPacienteIdAndCitaIdNotOrderByCitaFechaDesc(c.getPaciente().getId(), citaId).stream()
                .map(d -> new HistorialDto(d.getCita().getId(), d.getCita().getFecha(), d.getDescripcion()))
                .toList();
        return new ContextoPaciente(c.getId(), c.getPaciente().getId(), c.getPaciente().getNombre(), c.getMotivo(),
                c.getPrioridad(), c.getDescripcionTriaje(), sint, hist);
    }

    /* ───────────── Paso 3: catálogo de medicamentos ───────────── */
    @Transactional(readOnly = true)
    public List<MedicamentoDto> catalogoMedicamentos() {
        return medicamentos.findAllByOrderByNombreAsc().stream()
                .map(m -> new MedicamentoDto(m.getId(), m.getNombre(), m.getFormaFarmaceutica(), m.getConcentracion()))
                .toList();
    }

    /* ───────────── Paso 4: firmar y registrar ───────────── */
    /**
     * Guarda diagnóstico + receta, marca la cita ATENDIDA, firma el documento con la clave del médico (PIN)
     * y registra la evidencia. Todo en una sola transacción: si algo falla, no queda nada a medias.
     * El envío del PDF por email se hace DESPUÉS (RecetaPdfEmailService) para que un fallo de correo no deshaga la firma.
     */
    @Transactional
    public EvidenciaDto emitir(Integer medicoId, Integer citaId, EmitirRequest req) {
        Cita cita = citaDelMedico(medicoId, citaId);
        if (!ESTADOS_ATENDIBLES.contains(cita.getEstado()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La cita no está en un estado que permita documentarla.");
        if (evidencias.findByCitaId(citaId).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta cita ya tiene un expediente firmado.");
        if (req.diagnostico() == null || req.diagnostico().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El diagnóstico es obligatorio.");

        FirmaMedico firma = firmas.activa(medicoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Primero crea tu firma digital."));
        PrivateKey clave = firmas.privada(firma, req.pin());   // PIN incorrecto → 403 (antes de escribir nada)

        // Diagnóstico
        Diagnostico dg = new Diagnostico();
        dg.setCita(cita);
        dg.setDescripcion(req.diagnostico().trim());
        dg.setIndicacion(req.indicacion() == null ? "" : req.indicacion().trim());
        diagnosticos.save(dg);

        // Receta (siempre se crea: guarda el estado de envío del email) + detalle
        Receta receta = new Receta();
        receta.setCita(cita);
        recetas.save(receta);
        for (FilaMedicamento f : Optional.ofNullable(req.medicamentos()).orElse(List.of())) {
            if (f.medicamentoId() == null) continue;
            Medicamento m = medicamentos.findById(f.medicamentoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Medicamento inexistente: " + f.medicamentoId()));
            DetalleReceta d = new DetalleReceta();
            d.setReceta(receta);
            d.setMedicamento(m);
            d.setDosis(f.dosis());
            d.setFrecuencia(f.frecuencia());
            d.setDuracion(f.duracion());
            d.setViaAdministracion(f.viaAdministracion());
            detalles.save(d);
        }

        cita.setEstado(ESTADO_ATENDIDA);
        cita.setDescripcionProgreso(dg.getDescripcion());

        // Hash + firma + anclaje
        String hash = FirmaMedicoService.sha256Hex(construirDocumento(cita));
        EvidenciaBlockchain ev = new EvidenciaBlockchain();
        ev.setCita(cita);
        ev.setHashDocumento(hash);
        ev.setFirma(firmas.firmar(clave, hash));
        ev.setMedicoPubKey(firma.getClavePublica());
        ev.setTxHashRed(anclarEnBlockchain(hash));
        ev.setFecha(LocalDate.now());
        ev.setHora(LocalTime.now().withNano(0));
        return aDto(evidencias.save(ev));
    }

    /* ───────────── Expedientes firmados + verificación ───────────── */
    @Transactional(readOnly = true)
    public List<EvidenciaDto> emitidos(Integer medicoId) {
        return evidencias.findByCitaMedicoIdOrderByIdDesc(medicoId).stream().map(this::aDto).toList();
    }

    /** Recalcula el hash con lo guardado y valida la firma con la clave pública. */
    @Transactional(readOnly = true)
    public VerificacionDto verificar(Integer medicoId, Integer evidenciaId) {
        EvidenciaBlockchain ev = evidencias.findById(evidenciaId)
                .filter(e -> e.getCita().getMedico() != null && e.getCita().getMedico().getId().equals(medicoId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evidencia no encontrada."));
        boolean hashOk = FirmaMedicoService.sha256Hex(construirDocumento(ev.getCita())).equals(ev.getHashDocumento());
        boolean firmaOk = firmas.verificar(ev.getMedicoPubKey(), ev.getHashDocumento(), ev.getFirma());
        return new VerificacionDto(hashOk, firmaOk);
    }

    /* ───────────── Internos ───────────── */
    private Cita citaDelMedico(Integer medicoId, Integer citaId) {
        return citas.findByIdAndMedicoId(citaId, medicoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada."));
    }

    /** Documento canónico (orden fijo de campos) que se hashea y se firma. Debe ser idéntico al emitir y al verificar. */
    private String construirDocumento(Cita c) {
        Diagnostico dg = diagnosticos.findTopByCitaIdOrderByIdDesc(c.getId()).orElse(null);
        List<Map<String, String>> meds = recetas.findByCitaId(c.getId())
                .map(r -> detalles.findByRecetaIdOrderByIdAsc(r.getId()).stream().map(d -> {
                    Map<String, String> m = new LinkedHashMap<>();
                    m.put("medicamento", d.getMedicamento().getNombre() + " " + Objects.toString(d.getMedicamento().getConcentracion(), ""));
                    m.put("dosis", Objects.toString(d.getDosis(), ""));
                    m.put("frecuencia", Objects.toString(d.getFrecuencia(), ""));
                    m.put("duracion", Objects.toString(d.getDuracion(), ""));
                    m.put("via_administracion", Objects.toString(d.getViaAdministracion(), ""));
                    return m;
                }).collect(Collectors.toList()))
                .orElse(List.of());

        Map<String, Object> doc = new LinkedHashMap<>();
        doc.put("cita_id", c.getId());
        doc.put("paciente_id", c.getPaciente().getId());
        doc.put("medico_id", c.getMedico().getId());
        doc.put("fecha", Objects.toString(c.getFecha(), ""));
        doc.put("hora_inicio", Objects.toString(c.getHoraInicio(), ""));
        doc.put("diagnostico", dg == null ? "" : Objects.toString(dg.getDescripcion(), ""));
        doc.put("indicacion", dg == null ? "" : Objects.toString(dg.getIndicacion(), ""));
        doc.put("medicamentos", meds);
        try {
            return mapper.writeValueAsString(doc);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("No se pudo construir el documento a firmar.", e);
        }
    }

    /** SIMULADO. Reemplazar por el envío real del hash a la red (web3j, Hyperledger, etc.) y devolver el tx hash. */
    private String anclarEnBlockchain(String hash) {
        return "0x" + FirmaMedicoService.sha256Hex(hash + System.nanoTime() + UUID.randomUUID());
    }

    private EvidenciaDto aDto(EvidenciaBlockchain e) {
        Cita c = e.getCita();
        Optional<Receta> receta = recetas.findByCitaId(c.getId());
        String resumen = receta
                .map(r -> detalles.findByRecetaIdOrderByIdAsc(r.getId()).stream()
                        .map(d -> d.getMedicamento().getNombre() + " " + Objects.toString(d.getMedicamento().getConcentracion(), ""))
                        .collect(Collectors.joining(", ")))
                .filter(s -> !s.isBlank())
                .orElse("Sin receta");
        boolean enviado = receta.map(r -> Boolean.TRUE.equals(r.getEstadoEnvioEmail())).orElse(false);
        return new EvidenciaDto(e.getId(), c.getId(), c.getPaciente().getNombre(), e.getFecha(), e.getHora(),
                e.getHashDocumento(), e.getTxHashRed(), e.getFirma(), resumen, enviado);
    }
}
