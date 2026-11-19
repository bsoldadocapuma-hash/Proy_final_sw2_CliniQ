package com.cliniq.cliniq_backend.config;

import com.cliniq.cliniq_backend.service.UsuarioService;
import com.cliniq.cliniq_backend.service.UsuarioService.CatalogoDto;
import com.cliniq.cliniq_backend.service.UsuarioService.CatalogoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private final UsuarioService service;

    @Override
    public void run(String... args) {
        System.out.println(">>> Ejecutando seeder...");
        sembrarAlergias();
        sembrarEspecialidades();
        System.out.println(">>> Seeder finalizado.");
    }

    private void sembrarAlergias() {
        List<String> existentes = service.listarAlergias().stream()
                .map(CatalogoResponse::nombre).toList();

        for (String nombre : List.of("Penicilina", "Polen", "Látex", "Mariscos", "Ibuprofeno",
                "Polvo", "Lactosa", "Gluten", "Aspirina", "Frutos secos")) {
            if (existentes.stream().noneMatch(n -> n.equalsIgnoreCase(nombre))) {
                service.crearAlergia(new CatalogoDto(nombre));
            }
        }
    }

    private void sembrarEspecialidades() {
        List<String> existentes = service.listarEspecialidades().stream()
                .map(CatalogoResponse::nombre).toList();

        for (String nombre : List.of("Medicina General", "Cardiología", "Pediatría", "Dermatología",
                "Traumatología", "Ginecología", "Neurología", "Oftalmología",
                "Odontología", "Psicología")) {
            if (existentes.stream().noneMatch(n -> n.equalsIgnoreCase(nombre))) {
                service.crearEspecialidad(new CatalogoDto(nombre));
            }
        }
    }
}