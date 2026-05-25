package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.ServicioMaterialRequest;
import avpublicidad.proyecto.model.ServicioMaterial;
import avpublicidad.proyecto.service.ServicioMaterialService;
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
@RequestMapping("/servicios-materiales")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ServicioMaterialController {

    private final ServicioMaterialService servicioMaterialService;

    @GetMapping
    public List<ServicioMaterial> listar() {
        return servicioMaterialService.listar();
    }

    @GetMapping("/{id}")
    public ServicioMaterial obtenerPorId(@PathVariable Integer id) {
        return servicioMaterialService.obtenerPorId(id);
    }

    @PostMapping
    public ServicioMaterial crear(@Valid @RequestBody ServicioMaterialRequest request) {
        return servicioMaterialService.crear(request);
    }

    @PutMapping("/{id}")
    public ServicioMaterial actualizar(@PathVariable Integer id, @Valid @RequestBody ServicioMaterialRequest request) {
        return servicioMaterialService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        servicioMaterialService.eliminar(id);
    }
}
