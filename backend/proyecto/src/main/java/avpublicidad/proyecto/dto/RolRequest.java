package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RolRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 50, message = "El nombre no debe exceder 50 caracteres")
    private String nombre;

    @NotBlank(message = "La descripcion es obligatoria")
    @Size(max = 100, message = "La descripcion no debe exceder 100 caracteres")
    private String descripcion;

    @NotNull(message = "El usuario que crea el rol es obligatorio")
    private Integer createdBy;

    private Integer updatedBy;

    private Integer deletedBy;
}
