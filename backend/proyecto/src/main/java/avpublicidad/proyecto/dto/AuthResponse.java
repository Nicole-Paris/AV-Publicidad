package avpublicidad.proyecto.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private String tipoToken;
    private Integer empleadoId;
    private String nombre;
    private String correo;
    private Integer rolId;
    private String rol;
}
