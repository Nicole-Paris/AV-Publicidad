package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.AuthResponse;
import avpublicidad.proyecto.dto.LoginRequest;
import avpublicidad.proyecto.dto.LogoutResponse;
import avpublicidad.proyecto.service.AuthService;
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

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    public LogoutResponse logout() {
        return authService.logout();
    }
}
