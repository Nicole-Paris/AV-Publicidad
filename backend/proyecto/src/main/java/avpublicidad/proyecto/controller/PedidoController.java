package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.PedidoRequest;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.service.PedidoService;
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
@RequestMapping("/pedidos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PedidoController {

    private final PedidoService pedidoService;

    @GetMapping
    public List<Pedido> listar() {
        return pedidoService.listar();
    }

    @GetMapping("/{id}")
    public Pedido obtenerPorId(@PathVariable Integer id) {
        return pedidoService.obtenerPorId(id);
    }

    @PostMapping
    public Pedido crear(@Valid @RequestBody PedidoRequest request) {
        return pedidoService.crear(request);
    }

    @PutMapping("/{id}")
    public Pedido actualizar(@PathVariable Integer id, @Valid @RequestBody PedidoRequest request) {
        return pedidoService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        pedidoService.eliminar(id);
    }
}
