package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class MaterialRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 45, message = "El nombre no debe exceder 45 caracteres")
    private String nombre;

    @NotBlank(message = "La unidad es obligatoria")
    private String unidad;

    @NotBlank(message = "El estado es obligatorio")
    private String estado;

    @NotNull(message = "El costo unitario es obligatorio")
    @DecimalMin(value = "0.01")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal costoUnitario;

    @NotNull(message = "La categoria de material es obligatoria")
    private Integer categoriaMaterialId;

    @NotNull(message = "El usuario que crea el material es obligatorio")
    private Integer createdBy;

    private Integer updatedBy;

    private Integer deletedBy;
}
