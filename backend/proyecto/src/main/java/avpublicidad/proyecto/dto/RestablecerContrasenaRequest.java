package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RestablecerContrasenaRequest {

    @NotBlank(message = "Escribe el correo.")
    @Email(message = "El correo no es valido.")
    private String correo;

    @NotBlank(message = "Escribe el codigo.")
    private String codigo;

    @NotBlank(message = "Escribe la nueva contrasena.")
    @Size(min = 6, message = "La contrasena debe tener al menos 6 caracteres.")
    private String nuevaContrasena;
}
