package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class PagoRequest {

    @NotNull
    @DecimalMin(value = "0.01")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal monto;

    @NotNull
    private LocalDate fecha;

    @NotNull
    private LocalTime horaPago;

    @NotBlank
    @Size(max = 50)
    private String referencia;

    @NotBlank
    private String formaPago;

    @NotBlank
    private String conceptoPago;

    @NotNull
    private Integer pedidoId;

    @NotNull
    private Integer empleadoIdEmpleado;

    @NotNull
    private Integer createdBy;

    private Integer updatedBy;

    private Integer deletedBy;
}
