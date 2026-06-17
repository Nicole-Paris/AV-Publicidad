package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.MaterialRequest;
import avpublicidad.proyecto.model.Material;
import avpublicidad.proyecto.service.MaterialService;
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
@RequestMapping("/materiales")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MaterialController {

    private final MaterialService materialService;

    @GetMapping
    public List<Material> listar() {
        return materialService.listar();
    }

    @GetMapping("/{id}")
    public Material obtenerPorId(@PathVariable Integer id) {
        return materialService.obtenerPorId(id);
    }

    @PostMapping
    public Material crear(@Valid @RequestBody MaterialRequest request) {
        return materialService.crear(request);
    }

    @PutMapping("/{id}")
    public Material actualizar(@PathVariable Integer id, @Valid @RequestBody MaterialRequest request) {
        return materialService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        materialService.eliminar(id);
    }
}
