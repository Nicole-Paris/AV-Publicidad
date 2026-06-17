package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.PagoRequest;
import avpublicidad.proyecto.model.Pago;
import avpublicidad.proyecto.service.PagoService;
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
@RequestMapping("/pagos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PagoController {

    private final PagoService pagoService;

    @GetMapping
    public List<Pago> listar() {
        return pagoService.listar();
    }

    @GetMapping("/{id}")
    public Pago obtenerPorId(@PathVariable Integer id) {
        return pagoService.obtenerPorId(id);
    }

    @PostMapping
    public Pago crear(@Valid @RequestBody PagoRequest request) {
        return pagoService.crear(request);
    }

    @PutMapping("/{id}")
    public Pago actualizar(@PathVariable Integer id, @Valid @RequestBody PagoRequest request) {
        return pagoService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        pagoService.eliminar(id);
    }
}
