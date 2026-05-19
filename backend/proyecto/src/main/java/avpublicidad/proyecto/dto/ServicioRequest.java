package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ServicioRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 60, message = "El nombre no debe exceder 60 caracteres")
    private String nombre;

    @Size(max = 100, message = "La descripcion no debe exceder 100 caracteres")
    private String descripcion;

    @NotBlank(message = "El estado es obligatorio")
    private String estado;

    @NotNull(message = "La categoria de servicio es obligatoria")
    private Integer categoriaServicioId;

    @NotNull(message = "El usuario que crea el servicio es obligatorio")
    private Integer createdBy;

    private Integer updatedBy;

    private Integer deletedBy;
}
