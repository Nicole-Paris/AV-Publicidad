package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.constants.RolConstants;
import avpublicidad.proyecto.dto.AuthResponse;
import avpublicidad.proyecto.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @Test
    void login_conCredencialesValidas_debeRetornarToken() throws Exception {
        when(authService.login(any())).thenReturn(new AuthResponse(
                "token.jwt",
                "Bearer",
                1,
                "Carlos Ramirez Lopez",
                "carlos@av.com",
                RolConstants.ID_ADMINISTRADOR,
                RolConstants.ADMINISTRADOR
        ));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token.jwt"))
                .andExpect(jsonPath("$.tipoToken").value("Bearer"))
                .andExpect(jsonPath("$.rol").value(RolConstants.ADMINISTRADOR));

        verify(authService).login(any());
    }

    @Test
    void logout_debeRetornarMensaje() throws Exception {
        when(authService.logout()).thenReturn(new avpublicidad.proyecto.dto.LogoutResponse("Sesion cerrada correctamente"));

        mockMvc.perform(post("/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Sesion cerrada correctamente"));

        verify(authService).logout();
    }

    @Test
    void login_sinCorreo_debeResponderBadRequest() throws Exception {
        LoginJson request = requestValido();
        request.correo = "";

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(authService);
    }

    @Test
    void login_conCorreoInvalido_debeResponderBadRequest() throws Exception {
        LoginJson request = requestValido();
        request.correo = "correo-invalido";

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(authService);
    }

    @Test
    void login_sinContrasena_debeResponderBadRequest() throws Exception {
        LoginJson request = requestValido();
        request.contrasena = "";

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(authService);
    }

    private LoginJson requestValido() {
        LoginJson request = new LoginJson();
        request.correo = "carlos@av.com";
        request.contrasena = "Password123";
        return request;
    }

    private static class LoginJson {
        public String correo;
        public String contrasena;
    }
}
