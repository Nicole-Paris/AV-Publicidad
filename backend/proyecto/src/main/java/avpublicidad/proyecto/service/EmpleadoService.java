package avpublicidad.proyecto.service;

import avpublicidad.proyecto.dto.EmpleadoRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Empleado;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmpleadoService {

    private final EmpleadoRepository empleadoRepository;
    private final SucursalRepository sucursalRepository;
    private final JdbcTemplate jdbcTemplate;

    public List<Empleado> listar() {
        return empleadoRepository.findByDeletedAtIsNull();
    }

    public Empleado obtenerPorId(Integer id) {
        return empleadoRepository.findById(id)
                .filter(empleado -> empleado.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado no encontrado"));
    }

    public Empleado crear(EmpleadoRequest request) {
        validarCorreoDisponible(request.getCorreo(), null);
        validarRol(request.getRolId());
        validarSucursal(request.getSucursalIdSucursal());

        Empleado empleado = Empleado.builder()
                .nombre(request.getNombre())
                .apellidoPaterno(request.getApellidoPaterno())
                .apellidoMaterno(request.getApellidoMaterno())
                .telefono(request.getTelefono())
                .correo(normalizarCorreo(request.getCorreo()))
                .contrasena(request.getContrasena())
                .horaEntrada(request.getHoraEntrada())
                .horaSalida(request.getHoraSalida())
                .rolId(request.getRolId())
                .sucursalIdSucursal(request.getSucursalIdSucursal())
                .build();

        return empleadoRepository.save(empleado);
    }

    public Empleado actualizar(Integer id, EmpleadoRequest request) {
        Empleado empleado = obtenerPorId(id);
        validarCorreoDisponible(request.getCorreo(), id);
        validarRol(request.getRolId());
        validarSucursal(request.getSucursalIdSucursal());

        empleado.setNombre(request.getNombre());
        empleado.setApellidoPaterno(request.getApellidoPaterno());
        empleado.setApellidoMaterno(request.getApellidoMaterno());
        empleado.setTelefono(request.getTelefono());
        empleado.setCorreo(normalizarCorreo(request.getCorreo()));
        empleado.setContrasena(request.getContrasena());
        empleado.setHoraEntrada(request.getHoraEntrada());
        empleado.setHoraSalida(request.getHoraSalida());
        empleado.setRolId(request.getRolId());
        empleado.setSucursalIdSucursal(request.getSucursalIdSucursal());

        return empleadoRepository.save(empleado);
    }

    public void eliminar(Integer id) {
        Empleado empleado = obtenerPorId(id);
        empleado.setDeletedAt(LocalDateTime.now());
        empleadoRepository.save(empleado);
    }

    private void validarCorreoDisponible(String correo, Integer idEmpleadoActual) {
        String correoNormalizado = normalizarCorreo(correo);
        if (correoNormalizado == null) {
            return;
        }

        empleadoRepository.findByCorreo(correoNormalizado)
                .filter(empleado -> !empleado.getIdEmpleado().equals(idEmpleadoActual))
                .ifPresent(empleado -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un empleado con ese correo");
                });
    }

    private void validarRol(Integer rolId) {
        if (rolId == null) {
            return;
        }

        Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM rol WHERE id_rol = ?",
                Integer.class,
                rolId
        );

        if (total == null || total == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rol no encontrado");
        }
    }

    private void validarSucursal(Integer sucursalId) {
        if (sucursalId != null && !sucursalRepository.existsById(sucursalId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada");
        }
    }

    private String normalizarCorreo(String correo) {
        if (correo == null || correo.isBlank()) {
            return null;
        }

        return correo.trim().toLowerCase();
    }
}
