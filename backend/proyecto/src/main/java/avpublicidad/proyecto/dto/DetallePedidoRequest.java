package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class DetallePedidoRequest {

    @DecimalMin(value = "0.01")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal cantidad;

    @NotNull
    @DecimalMin(value = "0.01")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal precioUnitario;

    @NotNull
    @DecimalMin(value = "0.01")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal subtotal;

    @NotBlank
    private String unidadDetalle;

    @NotNull
    private Integer pedidoId;

    @NotNull
    private Integer servicioId;

    @NotNull
    private Integer createdBy;

    private Integer updatedBy;

    private Integer deletedBy;
}
