package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.ServicioRequest;
import avpublicidad.proyecto.model.Servicio;
import avpublicidad.proyecto.service.ServicioService;
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
@RequestMapping("/servicios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ServicioController {

    private final ServicioService servicioService;

    @GetMapping
    public List<Servicio> listar() {
        return servicioService.listar();
    }

    @GetMapping("/{id}")
    public Servicio obtenerPorId(@PathVariable Integer id) {
        return servicioService.obtenerPorId(id);
    }

    @PostMapping
    public Servicio crear(@Valid @RequestBody ServicioRequest request) {
        return servicioService.crear(request);
    }

    @PutMapping("/{id}")
    public Servicio actualizar(@PathVariable Integer id, @Valid @RequestBody ServicioRequest request) {
        return servicioService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        servicioService.eliminar(id);
    }
}
