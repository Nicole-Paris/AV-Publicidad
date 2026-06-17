package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmpleadoCuentaRequest {

    @Size(max = 15, message = "El telefono no debe exceder 15 caracteres")
    private String telefono;

    @Size(max = 255, message = "La contrasena no debe exceder 255 caracteres")
    private String contrasena;

    private Integer updatedBy;
}
