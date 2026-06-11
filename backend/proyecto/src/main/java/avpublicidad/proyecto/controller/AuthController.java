package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.AuthResponse;
import avpublicidad.proyecto.dto.LoginRequest;
import avpublicidad.proyecto.dto.LogoutResponse;
import avpublicidad.proyecto.dto.RecuperacionCodigoRequest;
import avpublicidad.proyecto.dto.RestablecerContrasenaRequest;
import avpublicidad.proyecto.service.AuthService;
import avpublicidad.proyecto.service.RecuperacionContrasenaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final RecuperacionContrasenaService recuperacionContrasenaService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    public LogoutResponse logout() {
        return authService.logout();
    }

    @PostMapping("/recuperacion/codigo")
    public LogoutResponse enviarCodigo(@Valid @RequestBody RecuperacionCodigoRequest request) {
        recuperacionContrasenaService.enviarCodigo(request);
        return new LogoutResponse("Codigo enviado al correo registrado");
    }

    @PostMapping("/recuperacion/restablecer")
    public LogoutResponse restablecerContrasena(@Valid @RequestBody RestablecerContrasenaRequest request) {
        recuperacionContrasenaService.restablecerContrasena(request);
        return new LogoutResponse("Contrasena restablecida correctamente");
    }
}
