package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.MovimientoInventarioConstants;
import avpublicidad.proyecto.dto.MovimientoInventarioRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.MovimientoInventario;
import avpublicidad.proyecto.repository.InventarioRepository;
import avpublicidad.proyecto.repository.MovimientoInventarioRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimientoInventarioService {

    private final MovimientoInventarioRepository movimientoInventarioRepository;
    private final InventarioRepository inventarioRepository;

    public List<MovimientoInventario> listar() {
        return movimientoInventarioRepository.findAll();
    }

    public MovimientoInventario obtenerPorId(Integer id) {
        return movimientoInventarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movimiento de inventario no encontrado"));
    }

    public MovimientoInventario crear(MovimientoInventarioRequest request) {
        validarInventario(request.getInventarioId());

        MovimientoInventario movimiento = MovimientoInventario.builder()
                .cantidad(request.getCantidad())
                .fecha(request.getFecha())
                .tipo(normalizarTipo(request.getTipo()))
                .motivo(request.getMotivo())
                .inventarioId(request.getInventarioId())
                .createdBy(request.getCreatedBy())
                .build();

        return movimientoInventarioRepository.save(movimiento);
    }

    public MovimientoInventario actualizar(Integer id, MovimientoInventarioRequest request) {
        MovimientoInventario movimiento = obtenerPorId(id);
        validarInventario(request.getInventarioId());

        movimiento.setCantidad(request.getCantidad());
        movimiento.setFecha(request.getFecha());
        movimiento.setTipo(normalizarTipo(request.getTipo()));
        movimiento.setMotivo(request.getMotivo());
        movimiento.setInventarioId(request.getInventarioId());
        movimiento.setCreatedBy(request.getCreatedBy());

        return movimientoInventarioRepository.save(movimiento);
    }

    public void eliminar(Integer id) {
        MovimientoInventario movimiento = obtenerPorId(id);
        movimientoInventarioRepository.delete(movimiento);
    }

    private void validarInventario(Integer inventarioId) {
        if (inventarioId != null && !inventarioRepository.existsById(inventarioId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventario no encontrado");
        }
    }

    private String normalizarTipo(String tipo) {
        if (tipo == null) {
            throw new ValidationException("El tipo de movimiento es obligatorio");
        }

        String valor = tipo.trim();
        if (MovimientoInventarioConstants.TIPO_ENTRADA.equalsIgnoreCase(valor)) {
            return MovimientoInventarioConstants.TIPO_ENTRADA;
        }
        if (MovimientoInventarioConstants.TIPO_SALIDA.equalsIgnoreCase(valor)) {
            return MovimientoInventarioConstants.TIPO_SALIDA;
        }

        throw new ValidationException("El tipo de movimiento debe ser Entrada o Salida");
    }
}
