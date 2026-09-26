package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.InventarioRequest;
import avpublicidad.proyecto.model.Inventario;
import avpublicidad.proyecto.service.InventarioService;
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
@RequestMapping("/inventarios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InventarioController {

    private final InventarioService inventarioService;

    @GetMapping
    public List<Inventario> listar() {
        return inventarioService.listar();
    }

    @GetMapping("/{id}")
    public Inventario obtenerPorId(@PathVariable Integer id) {
        return inventarioService.obtenerPorId(id);
    }

    @PostMapping
    public Inventario crear(@Valid @RequestBody InventarioRequest request) {
        return inventarioService.crear(request);
    }

    @PutMapping("/{id}")
    public Inventario actualizar(@PathVariable Integer id, @Valid @RequestBody InventarioRequest request) {
        return inventarioService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        inventarioService.eliminar(id);
    }
}
