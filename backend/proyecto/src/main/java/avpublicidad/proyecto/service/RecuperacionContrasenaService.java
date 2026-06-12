package avpublicidad.proyecto.service;

import avpublicidad.proyecto.dto.RecuperacionCodigoRequest;
import avpublicidad.proyecto.dto.RestablecerContrasenaRequest;
import avpublicidad.proyecto.dto.ValidarCodigoRecuperacionRequest;
import avpublicidad.proyecto.model.Empleado;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class RecuperacionContrasenaService {

    private static final int MINUTOS_VIGENCIA = 10;

    private final EmpleadoRepository empleadoRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, CodigoRecuperacion> codigos = new ConcurrentHashMap<>();

    @Value("${app.mail.from:}")
    private String mailFrom;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public void enviarCodigo(RecuperacionCodigoRequest request) {
        String correo = normalizarCorreo(request.getCorreo());
        Empleado empleado = empleadoRepository.findByCorreo(correo)
                .filter(valor -> valor.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe un empleado con ese correo."));

        String codigo = generarCodigo();
        codigos.put(correo, new CodigoRecuperacion(codigo, LocalDateTime.now().plusMinutes(MINUTOS_VIGENCIA)));
        enviarCorreo(empleado, codigo);
    }

    public void validarCodigo(ValidarCodigoRecuperacionRequest request) {
        String correo = normalizarCorreo(request.getCorreo());
        validarCodigoVigente(correo, request.getCodigo());
    }

    public void restablecerContrasena(RestablecerContrasenaRequest request) {
        String correo = normalizarCorreo(request.getCorreo());
        validarCodigoVigente(correo, request.getCodigo());

        Empleado empleado = empleadoRepository.findByCorreo(correo)
                .filter(valor -> valor.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe un empleado con ese correo."));

        empleado.setContrasena(passwordEncoder.encode(request.getNuevaContrasena()));
        empleadoRepository.save(empleado);
        codigos.remove(correo);
    }

    private void validarCodigoVigente(String correo, String codigo) {
        CodigoRecuperacion recuperacion = codigos.get(correo);

        if (recuperacion == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Primero solicita un codigo de recuperacion.");
        }

        if (recuperacion.expiraEn().isBefore(LocalDateTime.now())) {
            codigos.remove(correo);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El codigo expiro. Solicita uno nuevo.");
        }

        if (!recuperacion.codigo().equals(codigo.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El codigo no es valido.");
        }
    }

    private void enviarCorreo(Empleado empleado, String codigo) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || remitente().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "No esta configurado el correo del sistema.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(remitente());
        message.setTo(empleado.getCorreo());
        message.setSubject("Codigo de recuperacion - AV Publicidad");
        message.setText("""
                Hola %s,

                Tu codigo para restablecer la contrasena es: %s

                Este codigo vence en %d minutos. Si no solicitaste este cambio, ignora este correo.
                """.formatted(empleado.getNombre(), codigo, MINUTOS_VIGENCIA));

        try {
            mailSender.send(message);
        } catch (MailException ex) {
            codigos.remove(normalizarCorreo(empleado.getCorreo()));
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "No se pudo enviar el correo de recuperacion.");
        }
    }

    private String generarCodigo() {
        return String.valueOf(100000 + secureRandom.nextInt(900000));
    }

    private String remitente() {
        if (mailFrom != null && !mailFrom.isBlank()) {
            return mailFrom.trim();
        }
        return mailUsername == null ? "" : mailUsername.trim();
    }

    private String normalizarCorreo(String correo) {
        return correo == null ? "" : correo.trim().toLowerCase();
    }

    private record CodigoRecuperacion(String codigo, LocalDateTime expiraEn) {
    }
}
