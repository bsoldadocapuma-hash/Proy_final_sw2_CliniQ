package com.cliniq.cliniq_backend.controller;

import com.cliniq.cliniq_backend.dto.CitaDtos.*;
import com.cliniq.cliniq_backend.service.CitaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/citas")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173") // ajusta al puerto de tu front
public class CitaController {

    private final CitaService service;

    /* Paciente / Coordinador */
    @PostMapping
    public ResponseEntity<CitaResponse> crear(@Valid @RequestBody CrearCitaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(req));
    }

    @GetMapping("/{id}")
    public CitaResponse obtener(@PathVariable Integer id) {
        return service.obtener(id);
    }

    @GetMapping("/paciente/{pacienteId}")
    public List<CitaResponse> porPaciente(@PathVariable Integer pacienteId) {
        return service.listarPorPaciente(pacienteId);
    }

    /* Coordinador: las tres columnas del tablero */
    @GetMapping("/pendientes")
    public List<CitaResponse> pendientes() {
        return service.listarPendientes();
    }

    @GetMapping("/confirmadas")
    public List<CitaResponse> confirmadas(@RequestParam(required = false) Integer medicoId) {
        return service.listarConfirmadas(medicoId);
    }

    @GetMapping("/cerradas")
    public List<CitaResponse> cerradas() {
        return service.listarCerradas();
    }

    @PutMapping("/{id}/confirmar")
    public CitaResponse confirmar(@PathVariable Integer id, @Valid @RequestBody ConfirmarCitaRequest req) {
        return service.confirmar(id, req);
    }

    @PutMapping("/{id}/rechazar")
    public CitaResponse rechazar(@PathVariable Integer id) {
        return service.rechazar(id);
    }

    @PutMapping("/{id}/cancelar")
    public CitaResponse cancelar(@PathVariable Integer id) {
        return service.cancelar(id);
    }

    @PutMapping("/{id}/reprogramar")
    public CitaResponse reprogramar(@PathVariable Integer id, @Valid @RequestBody ReprogramarRequest req) {
        return service.reprogramar(id, req);
    }

    /* Médico */
    @GetMapping("/medico/{medicoId}/agenda")
    public List<CitaResponse> agenda(@PathVariable Integer medicoId,
                                     @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return service.agendaMedico(medicoId, fecha);
    }

    @GetMapping("/medico/{medicoId}/ocupadas")
    public List<LocalTime> ocupadas(@PathVariable Integer medicoId,
                                    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return service.horasOcupadas(medicoId, fecha);
    }

    @PutMapping("/{id}/estado")
    public CitaResponse cambiarEstado(@PathVariable Integer id, @Valid @RequestBody CambiarEstadoRequest req) {
        return service.cambiarEstado(id, req.estado());
    }

    @PutMapping("/{id}/finalizar")
    public CitaResponse finalizar(@PathVariable Integer id, @Valid @RequestBody FinalizarRequest req) {
        return service.finalizar(id, req);
    }
}