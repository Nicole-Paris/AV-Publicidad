package avpublicidad.proyecto.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
public class EmpleadoRequest {

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

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo debe tener un formato valido")
    @Size(max = 100, message = "El correo no debe exceder 100 caracteres")
    private String correo;

    @NotBlank(message = "La contrasena es obligatoria")
    @Size(max = 255, message = "La contrasena no debe exceder 255 caracteres")
    private String contrasena;

    @NotNull(message = "La hora de entrada es obligatoria")
    private LocalTime horaEntrada;

    @NotNull(message = "La hora de salida es obligatoria")
    private LocalTime horaSalida;

    @NotNull(message = "El rol es obligatorio")
    private Integer rolId;

    @NotNull(message = "La sucursal es obligatoria")
    private Integer sucursalIdSucursal;
}
