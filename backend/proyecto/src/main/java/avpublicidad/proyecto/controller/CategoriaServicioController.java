package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.CategoriaServicioRequest;
import avpublicidad.proyecto.model.CategoriaServicio;
import avpublicidad.proyecto.service.CategoriaServicioService;
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
@RequestMapping("/categorias-servicio")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategoriaServicioController {

    private final CategoriaServicioService categoriaServicioService;

    @GetMapping
    public List<CategoriaServicio> listar() {
        return categoriaServicioService.listar();
    }

    @GetMapping("/{id}")
    public CategoriaServicio obtenerPorId(@PathVariable Integer id) {
        return categoriaServicioService.obtenerPorId(id);
    }

    @PostMapping
    public CategoriaServicio crear(@Valid @RequestBody CategoriaServicioRequest request) {
        return categoriaServicioService.crear(request);
    }

    @PutMapping("/{id}")
    public CategoriaServicio actualizar(@PathVariable Integer id, @Valid @RequestBody CategoriaServicioRequest request) {
        return categoriaServicioService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        categoriaServicioService.eliminar(id);
    }
}
