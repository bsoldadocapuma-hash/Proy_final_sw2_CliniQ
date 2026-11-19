package com.cliniq.cliniq_backend.service;

import com.cliniq.cliniq_backend.dto.ExpedienteDtos.EnvioDto;
import com.cliniq.cliniq_backend.model.*;
import com.cliniq.cliniq_backend.repository.*;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Objects;

/** Genera el PDF firmado de la receta/resumen y lo envía por email al paciente. */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecetaPdfEmailService {

    private final CitaRepository citas;
    private final DiagnosticoRepository diagnosticos;
    private final RecetaRepository recetas;
    private final DetalleRecetaRepository detalles;
    private final EvidenciaBlockchainRepository evidencias;
    private final FirmaMedicoService firmas;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@cliniq.local}")
    private String remitente;

    @Value("${cliniq.pdf.dir:pdfs}")
    private String carpetaPdf;

    /** PDF del expediente firmado (para descargar o adjuntar). */
    @Transactional(readOnly = true)
    public byte[] generarPdf(Integer medicoId, Integer citaId) {
        Cita c = citas.findByIdAndMedicoId(citaId, medicoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada."));
        EvidenciaBlockchain ev = evidencias.findByCitaId(citaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "La cita aún no tiene expediente firmado."));
        return construirPdf(c, ev);
    }

    /**
     * Genera el PDF, lo guarda en disco, lo envía al paciente y marca la receta como enviada.
     * Un fallo del correo NO lanza excepción: se devuelve en EnvioDto para que la firma ya emitida no se pierda.
     */
    @Transactional
    public EnvioDto enviar(Integer medicoId, Integer citaId) {
        byte[] pdf = generarPdf(medicoId, citaId);
        Cita c = citas.findByIdAndMedicoId(citaId, medicoId).orElseThrow();
        Receta receta = recetas.findByCitaId(citaId).orElseThrow();
        String destino = c.getPaciente().getEmail();
        String nombreArchivo = "receta_cita_" + citaId + ".pdf";

        try {
            Path dir = Path.of(carpetaPdf);
            Files.createDirectories(dir);
            Path archivo = dir.resolve(nombreArchivo);
            Files.write(archivo, pdf);
            receta.setPdfGeneradoUrl(archivo.toString());
        } catch (IOException e) {
            log.warn("No se pudo guardar el PDF de la cita {}: {}", citaId, e.getMessage());
        }

        if (destino == null || destino.isBlank()) {
            receta.setEstadoEnvioEmail(false);
            return new EnvioDto(false, null, "El paciente no tiene email registrado.");
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setFrom(remitente);
            h.setTo(destino);
            h.setSubject("Tu receta y resumen de consulta - " + c.getFecha());
            h.setText("Hola " + c.getPaciente().getNombre() + ",\n\nAdjuntamos el PDF con el diagnóstico, las indicaciones y la receta "
                    + "de tu consulta del " + c.getFecha() + ", firmado digitalmente por " + c.getMedico().getNombre() + ".\n\nClinIQ");
            h.addAttachment(nombreArchivo, new ByteArrayResource(pdf));
            mailSender.send(msg);
            receta.setEstadoEnvioEmail(true);
            return new EnvioDto(true, destino, null);
        } catch (Exception e) {
            log.error("Fallo al enviar el correo de la cita {}", citaId, e);
            receta.setEstadoEnvioEmail(false);
            return new EnvioDto(false, destino, "No se pudo enviar el correo: " + e.getMessage());
        }
    }

    /* ───────────── PDF (OpenPDF) ───────────── */
    private byte[] construirPdf(Cita c, EvidenciaBlockchain ev) {
        Diagnostico dg = diagnosticos.findTopByCitaIdOrderByIdDesc(c.getId()).orElse(null);
        List<DetalleReceta> meds = recetas.findByCitaId(c.getId())
                .map(r -> detalles.findByRecetaIdOrderByIdAsc(r.getId())).orElse(List.of());
        String nombreFirma = firmas.porClavePublica(ev.getMedicoPubKey()).map(FirmaMedico::getNombreFirma).orElse(null);

        Font h1 = new Font(Font.HELVETICA, 18, Font.BOLD);
        Font h2 = new Font(Font.HELVETICA, 12, Font.BOLD);
        Font txt = new Font(Font.HELVETICA, 10);
        Font mini = new Font(Font.COURIER, 7);
        Font firmaFont = new Font(Font.TIMES_ROMAN, 20, Font.BOLDITALIC);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 50, 50, 50, 50);
        try {
            PdfWriter.getInstance(doc, out);
            doc.open();
            doc.add(new Paragraph("ClinIQ - Receta y resumen de consulta", h1));
            doc.add(new Paragraph("Documento firmado digitalmente por el médico\n\n", txt));

            doc.add(new Paragraph("Datos de la consulta", h2));
            doc.add(new Paragraph("Paciente: " + c.getPaciente().getNombre(), txt));
            doc.add(new Paragraph("Médico: " + c.getMedico().getNombre(), txt));
            doc.add(new Paragraph("Fecha: " + c.getFecha() + " " + Objects.toString(c.getHoraInicio(), "")
                    + " - Modalidad: " + Objects.toString(c.getModalidad(), "-"), txt));
            doc.add(new Paragraph("Motivo: " + Objects.toString(c.getMotivo(), "-") + "\n\n", txt));

            doc.add(new Paragraph("Diagnóstico", h2));
            doc.add(new Paragraph(dg == null ? "-" : Objects.toString(dg.getDescripcion(), "-") + "\n\n", txt));
            doc.add(new Paragraph("Indicaciones", h2));
            doc.add(new Paragraph(dg == null ? "-" : Objects.toString(dg.getIndicacion(), "-") + "\n\n", txt));

            doc.add(new Paragraph("Medicamentos recetados", h2));
            if (meds.isEmpty()) doc.add(new Paragraph("Sin medicamentos.", txt));
            int i = 1;
            for (DetalleReceta d : meds) {
                Medicamento m = d.getMedicamento();
                doc.add(new Paragraph(i++ + ". " + m.getNombre() + " " + Objects.toString(m.getConcentracion(), "")
                        + " - " + Objects.toString(d.getDosis(), "") + " - " + Objects.toString(d.getFrecuencia(), "")
                        + " - " + Objects.toString(d.getDuracion(), "") + " - Vía: " + Objects.toString(d.getViaAdministracion(), ""), txt));
            }

            doc.add(new Paragraph("\nFirma digital", h2));
            if (nombreFirma != null) doc.add(new Paragraph(nombreFirma, firmaFont));
            doc.add(new Paragraph("Firmado por " + c.getMedico().getNombre() + " el " + ev.getFecha() + " a las " + ev.getHora(), txt));
            doc.add(new Paragraph("Hash SHA-256: " + ev.getHashDocumento(), mini));
            doc.add(new Paragraph("Firma ECDSA (P-256, Base64): " + Objects.toString(ev.getFirma(), "-"), mini));
            doc.add(new Paragraph("Transacción en red (simulada): " + Objects.toString(ev.getTxHashRed(), "-"), mini));
            doc.add(new Paragraph("\nEste documento puede verificarse recalculando su hash y validando la firma con la clave pública del médico.", txt));
        } catch (DocumentException e) {
            throw new IllegalStateException("No se pudo generar el PDF.", e);
        } finally {
            if (doc.isOpen()) doc.close();
        }
        return out.toByteArray();
    }
}
