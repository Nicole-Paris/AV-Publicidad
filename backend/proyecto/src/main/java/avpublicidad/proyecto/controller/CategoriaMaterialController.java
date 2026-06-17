package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.CategoriaMaterialRequest;
import avpublicidad.proyecto.model.CategoriaMaterial;
import avpublicidad.proyecto.service.CategoriaMaterialService;
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
@RequestMapping("/categorias-material")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategoriaMaterialController {

    private final CategoriaMaterialService categoriaMaterialService;

    @GetMapping
    public List<CategoriaMaterial> listar() {
        return categoriaMaterialService.listar();
    }

    @GetMapping("/{id}")
    public CategoriaMaterial obtenerPorId(@PathVariable Integer id) {
        return categoriaMaterialService.obtenerPorId(id);
    }

    @PostMapping
    public CategoriaMaterial crear(@Valid @RequestBody CategoriaMaterialRequest request) {
        return categoriaMaterialService.crear(request);
    }

    @PutMapping("/{id}")
    public CategoriaMaterial actualizar(@PathVariable Integer id, @Valid @RequestBody CategoriaMaterialRequest request) {
        return categoriaMaterialService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        categoriaMaterialService.eliminar(id);
    }
}
