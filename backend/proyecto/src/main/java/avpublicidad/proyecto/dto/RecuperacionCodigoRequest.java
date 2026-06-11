package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RecuperacionCodigoRequest {

    @NotBlank(message = "Escribe el correo.")
    @Email(message = "El correo no es valido.")
    private String correo;
}
