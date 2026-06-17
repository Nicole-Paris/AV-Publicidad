package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.MaterialConstants;
import avpublicidad.proyecto.constants.MovimientoInventarioConstants;
import avpublicidad.proyecto.dto.MovimientoInventarioRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Inventario;
import avpublicidad.proyecto.model.Material;
import avpublicidad.proyecto.model.MovimientoInventario;
import avpublicidad.proyecto.repository.InventarioRepository;
import avpublicidad.proyecto.repository.MaterialRepository;
import avpublicidad.proyecto.repository.MovimientoInventarioRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimientoInventarioService {

    private final MovimientoInventarioRepository movimientoInventarioRepository;
    private final InventarioRepository inventarioRepository;
    private final MaterialRepository materialRepository;

    public List<MovimientoInventario> listar() {
        return movimientoInventarioRepository.findAll();
    }

    public MovimientoInventario obtenerPorId(Integer id) {
        return movimientoInventarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movimiento de inventario no encontrado"));
    }

    @Transactional
    public MovimientoInventario crear(MovimientoInventarioRequest request) {
        Inventario inventario = obtenerInventario(request.getInventarioId());
        String tipo = normalizarTipo(request.getTipo());
        aplicarMovimiento(inventario, tipo, request.getCantidad());

        MovimientoInventario movimiento = MovimientoInventario.builder()
                .cantidad(request.getCantidad())
                .fecha(LocalDateTime.now())
                .tipo(tipo)
                .motivo(request.getMotivo())
                .inventarioId(request.getInventarioId())
                .createdBy(request.getCreatedBy())
                .build();

        inventarioRepository.save(inventario);
        return movimientoInventarioRepository.save(movimiento);
    }

    @Transactional
    public MovimientoInventario actualizar(Integer id, MovimientoInventarioRequest request) {
        MovimientoInventario movimiento = obtenerPorId(id);
        Inventario inventarioAnterior = obtenerInventario(movimiento.getInventarioId());
        revertirMovimiento(inventarioAnterior, movimiento.getTipo(), movimiento.getCantidad());
        inventarioRepository.save(inventarioAnterior);

        Inventario inventarioNuevo = obtenerInventario(request.getInventarioId());
        String tipoNuevo = normalizarTipo(request.getTipo());
        aplicarMovimiento(inventarioNuevo, tipoNuevo, request.getCantidad());

        movimiento.setCantidad(request.getCantidad());
        movimiento.setTipo(tipoNuevo);
        movimiento.setMotivo(request.getMotivo());
        movimiento.setInventarioId(request.getInventarioId());
        movimiento.setCreatedBy(request.getCreatedBy());

        inventarioRepository.save(inventarioNuevo);
        return movimientoInventarioRepository.save(movimiento);
    }

    @Transactional
    public void eliminar(Integer id) {
        MovimientoInventario movimiento = obtenerPorId(id);
        Inventario inventario = obtenerInventario(movimiento.getInventarioId());
        revertirMovimiento(inventario, movimiento.getTipo(), movimiento.getCantidad());
        inventarioRepository.save(inventario);
        movimientoInventarioRepository.delete(movimiento);
    }

    private Inventario obtenerInventario(Integer inventarioId) {
        return inventarioRepository.findById(inventarioId)
                .filter(inventario -> inventario.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventario no encontrado"));
    }

    private void aplicarMovimiento(Inventario inventario, String tipo, BigDecimal cantidad) {
        validarMaterialActivo(inventario.getMaterialId());

        if (cantidad == null || cantidad.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("La cantidad del movimiento debe ser mayor a cero");
        }

        if (MovimientoInventarioConstants.TIPO_ENTRADA.equals(tipo)) {
            inventario.setStockActual(inventario.getStockActual().add(cantidad));
            return;
        }

        BigDecimal stockFinal = inventario.getStockActual().subtract(cantidad);
        if (stockFinal.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("La salida no puede dejar el stock en negativo");
        }
        inventario.setStockActual(stockFinal);
    }

    private void revertirMovimiento(Inventario inventario, String tipo, BigDecimal cantidad) {
        if (cantidad == null) {
            return;
        }

        if (MovimientoInventarioConstants.TIPO_ENTRADA.equals(tipo)) {
            inventario.setStockActual(inventario.getStockActual().subtract(cantidad));
            return;
        }

        inventario.setStockActual(inventario.getStockActual().add(cantidad));
    }

    private void validarMaterialActivo(Integer materialId) {
        Material material = materialRepository.findById(materialId)
                .filter(valor -> valor.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material no encontrado"));

        if (!MaterialConstants.ESTADO_DISPONIBLE.equals(material.getEstado())) {
            throw new ValidationException("No se pueden registrar movimientos de un material inactivo");
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
