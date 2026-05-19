package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.DetallePedidoRequest;
import avpublicidad.proyecto.model.DetallePedido;
import avpublicidad.proyecto.service.DetallePedidoService;
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
@RequestMapping("/detalles-pedido")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DetallePedidoController {

    private final DetallePedidoService detallePedidoService;

    @GetMapping
    public List<DetallePedido> listar() {
        return detallePedidoService.listar();
    }

    @GetMapping("/{id}")
    public DetallePedido obtenerPorId(@PathVariable Integer id) {
        return detallePedidoService.obtenerPorId(id);
    }

    @PostMapping
    public DetallePedido crear(@Valid @RequestBody DetallePedidoRequest request) {
        return detallePedidoService.crear(request);
    }

    @PutMapping("/{id}")
    public DetallePedido actualizar(@PathVariable Integer id, @Valid @RequestBody DetallePedidoRequest request) {
        return detallePedidoService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        detallePedidoService.eliminar(id);
    }
}
