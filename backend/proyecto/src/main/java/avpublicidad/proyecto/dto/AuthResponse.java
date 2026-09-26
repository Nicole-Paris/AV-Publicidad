package avpublicidad.proyecto.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

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
    private Integer sucursalIdSucursal;
    private String sucursal;
    private List<SucursalSesionResponse> sucursales;

    public AuthResponse(
            String token,
            String tipoToken,
            Integer empleadoId,
            String nombre,
            String correo,
            Integer rolId,
            String rol,
            Integer sucursalIdSucursal,
            String sucursal
    ) {
        this(
                token,
                tipoToken,
                empleadoId,
                nombre,
                correo,
                rolId,
                rol,
                sucursalIdSucursal,
                sucursal,
                List.of(new SucursalSesionResponse(sucursalIdSucursal, sucursal))
        );
    }

    @Getter
    @AllArgsConstructor
    public static class SucursalSesionResponse {
        private Integer idSucursal;
        private String nombre;
    }
}
