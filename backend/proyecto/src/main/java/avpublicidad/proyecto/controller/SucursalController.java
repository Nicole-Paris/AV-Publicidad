package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.SucursalRequest;
import avpublicidad.proyecto.model.Sucursal;
import avpublicidad.proyecto.service.SucursalService;
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
@RequestMapping("/sucursales")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SucursalController {

    private final SucursalService sucursalService;

    @GetMapping
    public List<Sucursal> listar() {
        return sucursalService.listar();
    }

    @GetMapping("/{id}")
    public Sucursal obtenerPorId(@PathVariable Integer id) {
        return sucursalService.obtenerPorId(id);
    }

    @PostMapping
    public Sucursal crear(@Valid @RequestBody SucursalRequest request) {
        return sucursalService.crear(request);
    }

    @PutMapping("/{id}")
    public Sucursal actualizar(@PathVariable Integer id, @Valid @RequestBody SucursalRequest request) {
        return sucursalService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        sucursalService.eliminar(id);
    }
}
