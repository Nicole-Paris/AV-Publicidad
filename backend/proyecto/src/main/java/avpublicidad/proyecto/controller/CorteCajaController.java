package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.CorteCajaRequest;
import avpublicidad.proyecto.model.CorteCaja;
import avpublicidad.proyecto.service.CorteCajaService;
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
@RequestMapping("/cortes-caja")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CorteCajaController {

    private final CorteCajaService corteCajaService;

    @GetMapping
    public List<CorteCaja> listar() {
        return corteCajaService.listar();
    }

    @GetMapping("/{id}")
    public CorteCaja obtenerPorId(@PathVariable Integer id) {
        return corteCajaService.obtenerPorId(id);
    }

    @PostMapping
    public CorteCaja crear(@Valid @RequestBody CorteCajaRequest request) {
        return corteCajaService.crear(request);
    }

    @PutMapping("/{id}")
    public CorteCaja actualizar(@PathVariable Integer id, @Valid @RequestBody CorteCajaRequest request) {
        return corteCajaService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        corteCajaService.eliminar(id);
    }
}
