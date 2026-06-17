package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class InventarioRequest {

    @NotNull
    @DecimalMin(value = "0.00")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal stockActual;

    @NotNull
    @DecimalMin(value = "0.00")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal stockMinimo;

    @NotNull
    private Integer materialId;

    @NotNull
    private Integer sucursalId;

    @NotNull
    private Integer createdBy;

    private Integer updatedBy;

    private Integer deletedBy;
}
