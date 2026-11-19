package com.cliniq.cliniq_backend.controller;

import com.cliniq.cliniq_backend.dto.ExpedienteDtos.*;
import com.cliniq.cliniq_backend.model.Usuario;
import com.cliniq.cliniq_backend.repository.UsuarioRepository;
import com.cliniq.cliniq_backend.service.ExpedienteService;
import com.cliniq.cliniq_backend.service.FirmaMedicoService;
import com.cliniq.cliniq_backend.service.RecetaPdfEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Backend de la pantalla "Crear Expediente" (médico).
 * El médico se obtiene del JWT (Authentication.getName() = email); nunca se recibe su id desde el front.
 * Si tienes roles configurados, agrega  @PreAuthorize("hasRole('MEDICO')")  a la clase.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ExpedienteController {

    private final UsuarioRepository usuarios;
    private final ExpedienteService expedientes;
    private final FirmaMedicoService firmas;
    private final RecetaPdfEmailService pdfEmail;

    private Usuario medico(Authentication auth) {
        return usuarios.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión inválida."));
    }

    /* ───────────── Pantalla ───────────── */

    /** Paso 1: citas confirmadas / en curso del médico. */
    @GetMapping("/expedientes/citas-por-atender")
    public List<CitaResumen> citasPorAtender(Authentication auth) {
        return expedientes.citasPorAtender(medico(auth).getId());
    }

    /** Panel lateral: motivo, triaje, síntomas e historial de diagnósticos del paciente de la cita. */
    @GetMapping("/expedientes/citas/{citaId}/contexto")
    public ContextoPaciente contexto(@PathVariable Integer citaId, Authentication auth) {
        return expedientes.contexto(medico(auth).getId(), citaId);
    }

    /** Paso 3: catálogo de medicamentos. */
    @GetMapping("/medicamentos")
    public List<MedicamentoDto> medicamentos() {
        return expedientes.catalogoMedicamentos();
    }

    /** Paso 4: firma (PIN), guarda diagnóstico + receta + evidencia y envía el PDF al email del paciente. */
    @PostMapping("/expedientes/citas/{citaId}/emitir")
    public EmitirResponse emitir(@PathVariable Integer citaId, @RequestBody EmitirRequest req, Authentication auth) {
        Integer medicoId = medico(auth).getId();
        EvidenciaDto evidencia = expedientes.emitir(medicoId, citaId, req);   // transacción 1: firma
        EnvioDto envio = pdfEmail.enviar(medicoId, citaId);                  // transacción 2: PDF + email
        return new EmitirResponse(evidencia, envio);
    }

    /** Sección "Expedientes firmados". */
    @GetMapping("/expedientes/emitidos")
    public List<EvidenciaDto> emitidos(Authentication auth) {
        return expedientes.emitidos(medico(auth).getId());
    }

    /** Botón "Verificar integridad". */
    @GetMapping("/expedientes/{evidenciaId}/verificar")
    public VerificacionDto verificar(@PathVariable Integer evidenciaId, Authentication auth) {
        return expedientes.verificar(medico(auth).getId(), evidenciaId);
    }

    /** Botón "Reenviar PDF". */
    @PostMapping("/expedientes/citas/{citaId}/enviar-email")
    public EnvioDto reenviar(@PathVariable Integer citaId, Authentication auth) {
        return pdfEmail.enviar(medico(auth).getId(), citaId);
    }

    /** Botones "Abrir PDF" / "Descargar". */
    @GetMapping("/expedientes/citas/{citaId}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable Integer citaId, @RequestParam(defaultValue = "false") boolean descargar,
                                      Authentication auth) {
        byte[] pdf = pdfEmail.generarPdf(medico(auth).getId(), citaId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        (descargar ? "attachment" : "inline") + "; filename=\"receta_cita_" + citaId + ".pdf\"")
                .body(pdf);
    }

    /* ───────────── Firma digital del médico ───────────── */

    /** Firma activa del médico (204 si no tiene). */
    @GetMapping("/firmas/mia")
    public ResponseEntity<FirmaDto> miFirma(Authentication auth) {
        return firmas.activaDto(medico(auth).getId()).map(ResponseEntity::ok).orElse(ResponseEntity.noContent().build());
    }

    /** "Crear firma digital" / "Generar nueva firma" (la anterior queda revocada). */
    @PostMapping("/firmas")
    public FirmaDto crearFirma(@RequestBody CrearFirmaRequest req, Authentication auth) {
        return firmas.crear(medico(auth), req.nombreFirma(), req.pin());
    }

    /** "Revocar firma". */
    @DeleteMapping("/firmas/mia")
    public ResponseEntity<Void> revocar(Authentication auth) {
        firmas.revocar(medico(auth).getId());
        return ResponseEntity.noContent().build();
    }
}
