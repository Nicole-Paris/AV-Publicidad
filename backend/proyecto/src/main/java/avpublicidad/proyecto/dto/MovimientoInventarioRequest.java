package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class MovimientoInventarioRequest {

    @NotNull
    @DecimalMin(value = "0.01")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal cantidad;

    @NotNull
    private LocalDateTime fecha;

    @NotBlank
    private String tipo;

    @NotBlank
    @Size(max = 50)
    private String motivo;

    @NotNull
    private Integer inventarioId;

    @NotNull
    private Integer createdBy;
}
