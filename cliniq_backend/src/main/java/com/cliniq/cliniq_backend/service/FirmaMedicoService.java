package com.cliniq.cliniq_backend.service;

import com.cliniq.cliniq_backend.dto.ExpedienteDtos.FirmaDto;
import com.cliniq.cliniq_backend.model.FirmaMedico;
import com.cliniq.cliniq_backend.model.Usuario;
import com.cliniq.cliniq_backend.repository.FirmaMedicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.AEADBadTagException;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Arrays;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Firma digital del médico: crea el par de claves ECDSA P-256, protege la privada con el PIN y firma/verifica hashes.
 * La firma usa el formato r||s (P1363), el mismo que produce WebCrypto en el navegador.
 */
@Service
@RequiredArgsConstructor
public class FirmaMedicoService {

    private static final SecureRandom RNG = new SecureRandom();
    private static final int PBKDF2_ITERACIONES = 210_000;
    private static final String ALG_FIRMA = "SHA256withECDSAinP1363Format";

    private final FirmaMedicoRepository repo;

    /* ───────────── Consultas ───────────── */
    @Transactional(readOnly = true)
    public Optional<FirmaMedico> activa(Integer medicoId) {
        return repo.findByUsuarioIdAndActivaTrue(medicoId);
    }

    @Transactional(readOnly = true)
    public Optional<FirmaDto> activaDto(Integer medicoId) {
        return activa(medicoId).map(this::aDto);
    }

    @Transactional(readOnly = true)
    public Optional<FirmaMedico> porClavePublica(String clavePublica) {
        return repo.findFirstByClavePublica(clavePublica);
    }

    /* ───────────── Crear / revocar ───────────── */
    /** Crea una firma nueva. Si el médico ya tenía una, queda revocada (su clave privada se borra). */
    @Transactional
    public FirmaDto crear(Usuario medico, String nombreFirma, String pin) {
        if (nombreFirma == null || nombreFirma.isBlank()) throw bad("Escribe el nombre que aparecerá en tu firma.");
        if (pin == null || !pin.matches("\\d{4,8}")) throw bad("El PIN debe tener entre 4 y 8 dígitos.");
        try {
            KeyPairGenerator g = KeyPairGenerator.getInstance("EC");
            g.initialize(new ECGenParameterSpec("secp256r1"));
            KeyPair par = g.generateKeyPair();

            byte[] salt = new byte[16];
            RNG.nextBytes(salt);

            repo.revocarTodas(medico.getId());

            FirmaMedico f = new FirmaMedico();
            f.setUsuario(medico);
            f.setNombreFirma(nombreFirma.trim());
            f.setClavePublica(b64(par.getPublic().getEncoded()));
            f.setClavePrivadaCifrada(cifrar(par.getPrivate().getEncoded(), pin, salt));
            f.setSalt(b64(salt));
            f.setHuella(sha256Hex(par.getPublic().getEncoded()).substring(0, 24));
            f.setActiva(true);
            return aDto(repo.save(f));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo generar la firma digital.", e);
        }
    }

    @Transactional
    public void revocar(Integer medicoId) {
        repo.revocarTodas(medicoId);
    }

    /* ───────────── Firmar / verificar ───────────── */
    /** Descifra la clave privada con el PIN. PIN incorrecto → 403. */
    public PrivateKey privada(FirmaMedico f, String pin) {
        if (pin == null || pin.isBlank()) throw bad("Ingresa el PIN de tu firma.");
        try {
            byte[] raw = Base64.getDecoder().decode(f.getClavePrivadaCifrada());
            byte[] iv = Arrays.copyOfRange(raw, 0, 12);
            byte[] cifrado = Arrays.copyOfRange(raw, 12, raw.length);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, claveDesdePin(pin, Base64.getDecoder().decode(f.getSalt())), new GCMParameterSpec(128, iv));
            byte[] pkcs8 = c.doFinal(cifrado);
            return KeyFactory.getInstance("EC").generatePrivate(new PKCS8EncodedKeySpec(pkcs8));
        } catch (AEADBadTagException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "PIN incorrecto.");
        } catch (GeneralSecurityException | RuntimeException e) {
            throw new IllegalStateException("No se pudo acceder a la clave de firma.", e);
        }
    }

    /** Firma el hash (texto hexadecimal) y devuelve la firma en Base64. */
    public String firmar(PrivateKey clave, String hashHex) {
        try {
            Signature s = Signature.getInstance(ALG_FIRMA);
            s.initSign(clave);
            s.update(hashHex.getBytes(StandardCharsets.UTF_8));
            return b64(s.sign());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo firmar el documento.", e);
        }
    }

    /** Valida la firma con la clave pública (X.509 Base64). Cualquier dato inválido → false. */
    public boolean verificar(String clavePublicaB64, String hashHex, String firmaB64) {
        if (clavePublicaB64 == null || hashHex == null || firmaB64 == null) return false;
        try {
            PublicKey pub = KeyFactory.getInstance("EC")
                    .generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(clavePublicaB64)));
            Signature s = Signature.getInstance(ALG_FIRMA);
            s.initVerify(pub);
            s.update(hashHex.getBytes(StandardCharsets.UTF_8));
            return s.verify(Base64.getDecoder().decode(firmaB64));
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            return false;
        }
    }

    /* ───────────── Utilidades ───────────── */
    public static String sha256Hex(byte[] datos) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(datos));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public static String sha256Hex(String texto) {
        return sha256Hex(texto.getBytes(StandardCharsets.UTF_8));
    }

    private FirmaDto aDto(FirmaMedico f) {
        return new FirmaDto(f.getId(), f.getNombreFirma(), f.getHuella(), f.getFechaCreacion(), Boolean.TRUE.equals(f.getActiva()));
    }

    private static ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    private static String b64(byte[] b) {
        return Base64.getEncoder().encodeToString(b);
    }

    private static SecretKey claveDesdePin(String pin, byte[] salt) throws GeneralSecurityException {
        SecretKeyFactory f = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        byte[] k = f.generateSecret(new PBEKeySpec(pin.toCharArray(), salt, PBKDF2_ITERACIONES, 256)).getEncoded();
        return new SecretKeySpec(k, "AES");
    }

    private static String cifrar(byte[] pkcs8, String pin, byte[] salt) throws GeneralSecurityException {
        byte[] iv = new byte[12];
        RNG.nextBytes(iv);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, claveDesdePin(pin, salt), new GCMParameterSpec(128, iv));
        byte[] ct = c.doFinal(pkcs8);
        byte[] out = new byte[iv.length + ct.length];
        System.arraycopy(iv, 0, out, 0, iv.length);
        System.arraycopy(ct, 0, out, iv.length, ct.length);
        return b64(out);
    }
}
