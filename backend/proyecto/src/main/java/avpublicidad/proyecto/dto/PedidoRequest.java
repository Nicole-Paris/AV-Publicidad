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
public class PedidoRequest {

    @NotNull(message = "La fecha del pedido es obligatoria")
    private LocalDateTime fechaPedido;

    @NotNull(message = "La fecha de entrega es obligatoria")
    private LocalDateTime fechaEntrega;

    @NotBlank(message = "El estado es obligatorio")
    private String estado;

    @NotNull(message = "El total es obligatorio")
    @DecimalMin(value = "0.00", message = "El total no puede ser negativo")
    @Digits(integer = 8, fraction = 2, message = "El total debe tener maximo 8 enteros y 2 decimales")
    private BigDecimal total;

    @Size(max = 100, message = "La descripcion no debe exceder 100 caracteres")
    private String descripcion;

    private String tipoPedido;

    @NotBlank(message = "La forma de pago es obligatoria")
    private String formaPago;

    @Size(max = 255, message = "El motivo de cancelacion no debe exceder 255 caracteres")
    private String motivoCancelacion;

    @NotNull(message = "El cliente es obligatorio")
    private Integer clienteId;

    @NotNull(message = "El empleado es obligatorio")
    private Integer empleadoId;

    @NotNull(message = "La sucursal es obligatoria")
    private Integer sucursalId;

    @NotNull(message = "El usuario que crea el pedido es obligatorio")
    private Integer createdBy;

    private Integer updatedBy;

    private Integer deletedBy;
}
