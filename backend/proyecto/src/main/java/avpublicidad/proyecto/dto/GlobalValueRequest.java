package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GlobalValueRequest {

    @NotBlank
    @Size(max = 45)
    private String tipo;

    @NotBlank
    @Size(max = 45)
    private String nombre;

    @NotBlank
    private String valor;

    @NotNull
    private Integer createdBy;

    private Integer updatedBy;

    private Integer deletedBy;
}
