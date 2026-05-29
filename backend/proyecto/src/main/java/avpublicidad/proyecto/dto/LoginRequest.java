package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    @NotBlank
    @Email
    private String correo;

    @NotBlank
    private String contrasena;

    @NotNull
    private Integer sucursalIdSucursal;
}
