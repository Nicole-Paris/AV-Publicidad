package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.MovimientoInventarioRequest;
import avpublicidad.proyecto.model.MovimientoInventario;
import avpublicidad.proyecto.service.MovimientoInventarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/movimientos-inventario")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MovimientoInventarioController {

    private final MovimientoInventarioService movimientoInventarioService;

    @GetMapping
    public List<MovimientoInventario> listar() {
        return movimientoInventarioService.listar();
    }

    @GetMapping("/{id}")
    public MovimientoInventario obtenerPorId(@PathVariable Integer id) {
        return movimientoInventarioService.obtenerPorId(id);
    }

    @PostMapping
    public MovimientoInventario crear(@Valid @RequestBody MovimientoInventarioRequest request) {
        return movimientoInventarioService.crear(request);
    }

    @PutMapping("/{id}")
    public MovimientoInventario actualizar(@PathVariable Integer id, @Valid @RequestBody MovimientoInventarioRequest request) {
        return movimientoInventarioService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        movimientoInventarioService.eliminar(id);
    }
}
