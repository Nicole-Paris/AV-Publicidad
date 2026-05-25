package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class CorteCajaRequest {

    @NotNull
    private LocalDate fecha;

    @NotNull
    private LocalTime horaInicio;

    private LocalTime horaFin;

    @NotNull
    @DecimalMin(value = "0.00")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal saldoInicial;

    @Digits(integer = 8, fraction = 2)
    private BigDecimal diferenciaSaldo;

    @Size(max = 100)
    private String descripcion;

    @DecimalMin(value = "0.00")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal saldoEsperado;

    @DecimalMin(value = "0.00")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal saldoReal;

    @NotNull
    private Integer empleadoId;

    @NotNull
    private Integer createdBy;

    private Integer updatedBy;

    private Integer deletedBy;
}
