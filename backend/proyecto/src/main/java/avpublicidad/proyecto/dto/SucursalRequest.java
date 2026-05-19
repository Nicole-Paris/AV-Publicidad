package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SucursalRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 50, message = "El nombre no debe exceder 50 caracteres")
    private String nombre;

    @NotBlank(message = "La direccion es obligatoria")
    @Size(max = 100, message = "La direccion no debe exceder 100 caracteres")
    private String direccion;

    @NotBlank(message = "El codigo postal es obligatorio")
    @Size(max = 10, message = "El codigo postal no debe exceder 10 caracteres")
    private String codigoPostal;

    @NotBlank(message = "El telefono es obligatorio")
    @Size(max = 15, message = "El telefono no debe exceder 15 caracteres")
    private String telefono;

    @NotBlank(message = "El horario es obligatorio")
    @Size(max = 100, message = "El horario no debe exceder 100 caracteres")
    private String horario;

    @NotNull(message = "El usuario que crea la sucursal es obligatorio")
    private Integer createdBy;

    private Integer updatedBy;

    private Integer deletedBy;
}
