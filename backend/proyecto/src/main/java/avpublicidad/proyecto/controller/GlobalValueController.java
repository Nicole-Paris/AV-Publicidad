package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.GlobalValueRequest;
import avpublicidad.proyecto.model.GlobalValue;
import avpublicidad.proyecto.service.GlobalValueService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/global-values")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GlobalValueController {

    private final GlobalValueService globalValueService;

    @GetMapping
    public List<GlobalValue> listar(@RequestParam(required = false) String tipo) {
        if (tipo != null && !tipo.isBlank()) {
            return globalValueService.listarPorTipo(tipo);
        }

        return globalValueService.listar();
    }

    @GetMapping("/{id}")
    public GlobalValue obtenerPorId(@PathVariable Integer id) {
        return globalValueService.obtenerPorId(id);
    }

    @GetMapping("/{tipo}/{nombre}")
    public GlobalValue obtenerPorTipoYNombre(@PathVariable String tipo, @PathVariable String nombre) {
        return globalValueService.obtenerPorTipoYNombre(tipo, nombre);
    }

    @PostMapping
    public GlobalValue crear(@Valid @RequestBody GlobalValueRequest request) {
        return globalValueService.crear(request);
    }

    @PutMapping("/{id}")
    public GlobalValue actualizar(@PathVariable Integer id, @Valid @RequestBody GlobalValueRequest request) {
        return globalValueService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        globalValueService.eliminar(id);
    }
}
