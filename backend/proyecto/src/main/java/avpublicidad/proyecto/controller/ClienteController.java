package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.dto.ClienteRequest;
import avpublicidad.proyecto.model.Cliente;
import avpublicidad.proyecto.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clientes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ClienteController {

    private final ClienteService clienteService;

    @GetMapping
    public List<Cliente> listar() {
        return clienteService.listar();
    }

    @GetMapping("/frecuentes")
    public List<Cliente> listarFrecuentes() {
        return clienteService.listarFrecuentes();
    }

    @GetMapping("/{id}")
    public Cliente obtenerPorId(@PathVariable Integer id) {
        return clienteService.obtenerPorId(id);
    }

    @PostMapping
    public Cliente crear(@Valid @RequestBody ClienteRequest request) {
        return clienteService.crear(request);
    }

    @PutMapping("/{id}")
    public Cliente actualizar(@PathVariable Integer id, @Valid @RequestBody ClienteRequest request) {
        return clienteService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        clienteService.eliminar(id);
    }
}
