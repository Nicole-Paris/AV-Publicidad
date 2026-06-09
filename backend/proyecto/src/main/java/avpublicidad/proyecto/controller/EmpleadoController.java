package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.EmpleadoCuentaRequest;
import avpublicidad.proyecto.dto.EmpleadoRequest;
import avpublicidad.proyecto.model.Empleado;
import avpublicidad.proyecto.service.EmpleadoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/empleados")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmpleadoController {

    private final EmpleadoService empleadoService;

    @GetMapping
    public List<Empleado> listar() {
        return empleadoService.listar();
    }

    @GetMapping("/{id}")
    public Empleado obtenerPorId(@PathVariable Integer id) {
        return empleadoService.obtenerPorId(id);
    }

    @PostMapping
    public Empleado crear(@Valid @RequestBody EmpleadoRequest request) {
        return empleadoService.crear(request);
    }

    @PutMapping("/{id}")
    public Empleado actualizar(@PathVariable Integer id, @Valid @RequestBody EmpleadoRequest request) {
        return empleadoService.actualizar(id, request);
    }

    @PutMapping("/{id}/cuenta")
    public Empleado actualizarCuenta(
            @PathVariable Integer id,
            @Valid @RequestBody EmpleadoCuentaRequest request,
            Authentication authentication
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Empleado empleadoAutenticado)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        if (!empleadoAutenticado.getIdEmpleado().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo puedes editar tu propia cuenta");
        }

        request.setUpdatedBy(empleadoAutenticado.getIdEmpleado());
        return empleadoService.actualizarCuenta(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id, @RequestParam(required = false) Integer deletedBy) {
        empleadoService.eliminar(id, deletedBy);
    }
}
