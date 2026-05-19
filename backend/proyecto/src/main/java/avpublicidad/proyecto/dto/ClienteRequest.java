package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ClienteRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 50, message = "El nombre no debe exceder 50 caracteres")
    private String nombre;

    @NotBlank(message = "El apellido paterno es obligatorio")
    @Size(max = 45, message = "El apellido paterno no debe exceder 45 caracteres")
    private String apellidoPaterno;

    @Size(max = 45, message = "El apellido materno no debe exceder 45 caracteres")
    private String apellidoMaterno;

    @NotBlank(message = "El telefono es obligatorio")
    @Size(max = 15, message = "El telefono no debe exceder 15 caracteres")
    private String telefono;

    @NotBlank(message = "El tipo de cliente es obligatorio")
    private String tipo;

    private Boolean tieneCredito;

    private BigDecimal creditoActual;

    private BigDecimal limiteCredito;

    @Size(max = 60, message = "La direccion no debe exceder 60 caracteres")
    private String direccion;

    @Size(max = 15, message = "El RFC no debe exceder 15 caracteres")
    private String rfc;

    @Size(max = 10, message = "El codigo postal no debe exceder 10 caracteres")
    private String codigoPostal;

    @Size(max = 30, message = "La razon social no debe exceder 30 caracteres")
    private String razonSocial;

    @NotNull(message = "El usuario que crea el cliente es obligatorio")
    private Integer createdBy;

    private Integer updatedBy;

    private Integer deletedBy;
}
