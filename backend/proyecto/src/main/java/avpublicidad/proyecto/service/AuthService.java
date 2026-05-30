package avpublicidad.proyecto.service;

import avpublicidad.proyecto.dto.AuthResponse;
import avpublicidad.proyecto.dto.LoginRequest;
import avpublicidad.proyecto.dto.LogoutResponse;
import avpublicidad.proyecto.model.Empleado;
import avpublicidad.proyecto.model.Rol;
import avpublicidad.proyecto.model.Sucursal;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.RolRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EmpleadoRepository empleadoRepository;
    private final RolRepository rolRepository;
    private final SucursalRepository sucursalRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse login(LoginRequest request) {
        String correo = normalizarCorreo(request.getCorreo());
        Empleado empleado = empleadoRepository.findByCorreo(correo)
                .filter(valor -> valor.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas"));

        if (!contrasenaValida(request.getContrasena(), empleado.getContrasena())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
        }

        String rol = rolRepository.findById(empleado.getRolId())
                .filter(valor -> valor.getDeletedAt() == null)
                .map(Rol::getNombre)
                .orElse("Sin rol");
        Sucursal sucursal = sucursalRepository.findById(empleado.getSucursalIdSucursal())
                .filter(valor -> valor.getDeletedAt() == null)
                .orElse(null);

        String token = jwtService.generarToken(empleado, rol);
        String nombreCompleto = construirNombreCompleto(empleado);

        return new AuthResponse(
                token,
                "Bearer",
                empleado.getIdEmpleado(),
                nombreCompleto,
                empleado.getCorreo(),
                empleado.getRolId(),
                rol,
                empleado.getSucursalIdSucursal(),
                sucursal == null ? null : sucursal.getNombre()
        );
    }

    public LogoutResponse logout() {
        return new LogoutResponse("Sesion cerrada correctamente");
    }

    private boolean contrasenaValida(String contrasenaIngresada, String contrasenaGuardada) {
        if (contrasenaGuardada != null && contrasenaGuardada.startsWith("$2")) {
            return passwordEncoder.matches(contrasenaIngresada, contrasenaGuardada);
        }

        return contrasenaIngresada != null && contrasenaIngresada.equals(contrasenaGuardada);
    }

    private String construirNombreCompleto(Empleado empleado) {
        StringBuilder nombre = new StringBuilder(empleado.getNombre());
        nombre.append(" ").append(empleado.getApellidoPaterno());

        if (empleado.getApellidoMaterno() != null && !empleado.getApellidoMaterno().isBlank()) {
            nombre.append(" ").append(empleado.getApellidoMaterno());
        }

        return nombre.toString();
    }

    private String normalizarCorreo(String correo) {
        return correo == null ? null : correo.trim().toLowerCase();
    }
}
