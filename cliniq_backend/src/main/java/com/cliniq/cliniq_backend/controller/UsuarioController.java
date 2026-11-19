package com.cliniq.cliniq_backend.controller;

import com.cliniq.cliniq_backend.service.UsuarioService;
import com.cliniq.cliniq_backend.service.UsuarioService.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService service;

    // ================= AUTH / REGISTRO =================
    @PostMapping("/usuarios/login")
    public LoginResponse login(@Valid @RequestBody LoginDto dto) {
        return service.login(dto);
    }

    @PostMapping("/usuarios/registro/paciente")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse registrarPaciente(@Valid @RequestBody CreatePacienteDto dto) {
        return service.registrarPaciente(dto);
    }

    @PostMapping("/usuarios/registro/medico")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse registrarMedico(@Valid @RequestBody CreateMedicoDto dto) {
        return service.registrarMedico(dto);
    }

    @PostMapping("/usuarios/registro/coordinador")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse registrarCoordinador(@Valid @RequestBody CreateCoordinadorDto dto) {
        return service.registrarCoordinador(dto);
    }

    @PatchMapping("/usuarios/cambiar-password")
    public Map<String, String> cambiarPassword(@Valid @RequestBody RecuperarPasswordDto dto) {
        return service.cambiarPassword(dto);
    }

    // ================= USUARIOS =================
    @GetMapping("/usuarios")
    public List<UsuarioDetalleResponse> listarUsuarios() {
        return service.listarUsuarios();
    }

    @DeleteMapping("/usuarios/{id}")
    public Map<String, String> eliminarUsuario(@PathVariable Integer id) {
        return service.eliminarUsuario(id);
    }

    // ================= MODIFICAR PERFIL (uno por rol) =================
    @PatchMapping("/usuarios/paciente/{id}/perfil")
    public UsuarioDetalleResponse modificarPerfilPaciente(@PathVariable Integer id,
                                                          @Valid @RequestBody UpdatePacienteDto dto) {
        return service.modificarPerfilPaciente(id, dto);
    }

    @PatchMapping("/usuarios/medico/{id}/perfil")
    public UsuarioDetalleResponse modificarPerfilMedico(@PathVariable Integer id,
                                                        @Valid @RequestBody UpdateMedicoDto dto) {
        return service.modificarPerfilMedico(id, dto);
    }

    @PatchMapping("/usuarios/coordinador/{id}/perfil")
    public UsuarioDetalleResponse modificarPerfilCoordinador(@PathVariable Integer id,
                                                             @Valid @RequestBody UpdateCoordinadorDto dto) {
        return service.modificarPerfilCoordinador(id, dto);
    }

    // ================= ALERGIAS DEL PACIENTE =================
    @PostMapping("/usuarios/{id}/alergias/{idAlergia}")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogoResponse agregarAlergiaAPaciente(@PathVariable Integer id, @PathVariable Integer idAlergia) {
        return service.agregarAlergiaAPaciente(id, idAlergia);
    }

    @GetMapping("/usuarios/{id}/alergias")
    public List<CatalogoResponse> obtenerAlergiasDePaciente(@PathVariable Integer id) {
        return service.obtenerAlergiasDePaciente(id);
    }

    @DeleteMapping("/usuarios/{id}/alergias/{idAlergia}")
    public Map<String, String> quitarAlergiaDePaciente(@PathVariable Integer id, @PathVariable Integer idAlergia) {
        return service.quitarAlergiaDePaciente(id, idAlergia);
    }

    // ================= SEGUROS (registrar, listar, eliminar) =================
    @PostMapping("/usuarios/{id}/seguros")
    @ResponseStatus(HttpStatus.CREATED)
    public SeguroResponse registrarSeguro(@PathVariable Integer id, @Valid @RequestBody CreateSeguroDto dto) {
        return service.registrarSeguro(id, dto);
    }

    @GetMapping("/usuarios/{id}/seguros")
    public List<SeguroResponse> listarSeguros(@PathVariable Integer id) {
        return service.listarSeguros(id);
    }

    @DeleteMapping("/usuarios/{id}/seguros/{idSeguro}")
    public Map<String, String> eliminarSeguro(@PathVariable Integer id, @PathVariable Integer idSeguro) {
        return service.eliminarSeguro(id, idSeguro);
    }

    // ================= CATÁLOGO ALERGIAS (crear, listar, eliminar) =================
    @PostMapping("/alergias")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogoResponse crearAlergia(@Valid @RequestBody CatalogoDto dto) {
        return service.crearAlergia(dto);
    }

    @GetMapping("/alergias")
    public List<CatalogoResponse> listarAlergias() {
        return service.listarAlergias();
    }

    @DeleteMapping("/alergias/{id}")
    public Map<String, String> eliminarAlergia(@PathVariable Integer id) {
        return service.eliminarAlergia(id);
    }

    // ================= CATÁLOGO ESPECIALIDADES (crear, listar, eliminar) =================
    @PostMapping("/especialidades")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogoResponse crearEspecialidad(@Valid @RequestBody CatalogoDto dto) {
        return service.crearEspecialidad(dto);
    }

    @GetMapping("/especialidades")
    public List<CatalogoResponse> listarEspecialidades() {
        return service.listarEspecialidades();
    }

    @DeleteMapping("/especialidades/{id}")
    public Map<String, String> eliminarEspecialidad(@PathVariable Integer id) {
        return service.eliminarEspecialidad(id);
    }
}