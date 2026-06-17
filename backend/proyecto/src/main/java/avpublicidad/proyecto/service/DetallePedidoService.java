package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.DetallePedidoConstants;
import avpublicidad.proyecto.constants.PedidoConstants;
import avpublicidad.proyecto.dto.DetallePedidoRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.DetallePedido;
import avpublicidad.proyecto.model.MovimientoInventario;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.model.ServicioMaterial;
import avpublicidad.proyecto.repository.DetallePedidoRepository;
import avpublicidad.proyecto.repository.InventarioRepository;
import avpublicidad.proyecto.repository.MovimientoInventarioRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import avpublicidad.proyecto.repository.ServicioMaterialRepository;
import avpublicidad.proyecto.repository.ServicioRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DetallePedidoService {

    private final DetallePedidoRepository detallePedidoRepository;
    private final PedidoRepository pedidoRepository;
    private final ServicioRepository servicioRepository;
    private final ServicioMaterialRepository servicioMaterialRepository;
    private final InventarioRepository inventarioRepository;
    private final MovimientoInventarioRepository movimientoInventarioRepository;

    public List<DetallePedido> listar() {
        return detallePedidoRepository.findByDeletedAtIsNull();
    }

    public DetallePedido obtenerPorId(Integer id) {
        return detallePedidoRepository.findById(id)
                .filter(detallePedido -> detallePedido.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Detalle de pedido no encontrado"));
    }

    public DetallePedido crear(DetallePedidoRequest request) {
        validarRelaciones(request);
        validarPedidoEditable(request.getPedidoId());
        BigDecimal subtotal = calcularSubtotal(request);

        DetallePedido detallePedido = DetallePedido.builder()
                .cantidad(request.getCantidad())
                .precioUnitario(request.getPrecioUnitario())
                .subtotal(subtotal)
                .unidadDetalle(normalizarUnidadDetalle(request.getUnidadDetalle()))
                .pedidoId(request.getPedidoId())
                .servicioId(request.getServicioId())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        DetallePedido detalleGuardado = detallePedidoRepository.save(detallePedido);
        disminuirMaterialesPedido(detalleGuardado);

        return detalleGuardado;
    }

    public DetallePedido actualizar(Integer id, DetallePedidoRequest request) {
        DetallePedido detallePedido = obtenerPorId(id);
        validarRelaciones(request);
        validarPedidoEditable(detallePedido.getPedidoId());
        validarPedidoEditable(request.getPedidoId());
        BigDecimal subtotal = calcularSubtotal(request);

        detallePedido.setCantidad(request.getCantidad());
        detallePedido.setPrecioUnitario(request.getPrecioUnitario());
        detallePedido.setSubtotal(subtotal);
        detallePedido.setUnidadDetalle(normalizarUnidadDetalle(request.getUnidadDetalle()));
        detallePedido.setPedidoId(request.getPedidoId());
        detallePedido.setServicioId(request.getServicioId());
        detallePedido.setCreatedBy(request.getCreatedBy());
        detallePedido.setUpdatedBy(request.getUpdatedBy());
        detallePedido.setDeletedBy(request.getDeletedBy());

        return detallePedidoRepository.save(detallePedido);
    }

    public void eliminar(Integer id) {
        DetallePedido detallePedido = obtenerPorId(id);
        validarPedidoEditable(detallePedido.getPedidoId());
        detallePedido.setDeletedAt(LocalDateTime.now());
        detallePedidoRepository.save(detallePedido);
    }

    private void disminuirMaterialesPedido(DetallePedido detallePedido) {
        if (detallePedido == null || detallePedido.getPedidoId() == null || detallePedido.getServicioId() == null
                || detallePedido.getCantidad() == null || detallePedido.getCantidad().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        Pedido pedido = pedidoRepository.findById(detallePedido.getPedidoId())
                .filter(pedidoEncontrado -> pedidoEncontrado.getDeletedAt() == null)
                .orElse(null);

        if (pedido == null || pedido.getSucursalId() == null) {
            return;
        }

        List<ServicioMaterial> materialesDelServicio = servicioMaterialRepository.findByDeletedAtIsNull();

        for (ServicioMaterial asignacion : materialesDelServicio) {
            if (!detallePedido.getServicioId().equals(asignacion.getServicioId())) {
                continue;
            }

            BigDecimal cantidadConsumida = asignacion.getCantidadUsada() == null
                    ? BigDecimal.ZERO
                    : asignacion.getCantidadUsada().multiply(detallePedido.getCantidad());

            if (cantidadConsumida.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            inventarioRepository.findByMaterialIdAndSucursalIdAndDeletedAtIsNull(asignacion.getMaterialId(), pedido.getSucursalId())
                    .ifPresent(inventario -> {
                        BigDecimal stockActual = inventario.getStockActual() == null ? BigDecimal.ZERO : inventario.getStockActual();
                        if (stockActual.compareTo(cantidadConsumida) < 0) {
                            throw new ValidationException("No hay suficiente stock para consumir el material requerido");
                        }

                        inventario.setStockActual(stockActual.subtract(cantidadConsumida));
                        inventarioRepository.save(inventario);

                        movimientoInventarioRepository.save(MovimientoInventario.builder()
                                .cantidad(cantidadConsumida)
                                .fecha(LocalDateTime.now())
                                .tipo("Salida")
                                .motivo("Pedido #" + detallePedido.getPedidoId())
                                .inventarioId(inventario.getIdInventario())
                                .createdBy(detallePedido.getCreatedBy() != null ? detallePedido.getCreatedBy() : pedido.getCreatedBy())
                                .build());
                    });
        }
    }

    private void validarRelaciones(DetallePedidoRequest request) {
        if (request.getPedidoId() != null && !pedidoRepository.existsById(request.getPedidoId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado");
        }

        if (request.getServicioId() != null && !servicioRepository.existsById(request.getServicioId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Servicio no encontrado");
        }
    }

    private void validarPedidoEditable(Integer pedidoId) {
        if (pedidoId == null) {
            return;
        }

        Pedido pedido = pedidoRepository.findById(pedidoId)
                .filter(pedidoEncontrado -> pedidoEncontrado.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));

        if (!PedidoConstants.ESTADO_BORRADOR.equals(pedido.getEstado())
                && !PedidoConstants.ESTADO_PENDIENTE.equals(pedido.getEstado())) {
            throw new ValidationException("Los detalles solo se pueden modificar en pedidos Borrador o Pendiente");
        }
    }

    private BigDecimal calcularSubtotal(DetallePedidoRequest request) {
        if (request.getCantidad() == null || request.getPrecioUnitario() == null) {
            return null;
        }

        BigDecimal subtotal = request.getCantidad()
                .multiply(request.getPrecioUnitario())
                .setScale(2, RoundingMode.HALF_UP);

        if (request.getSubtotal() != null && request.getSubtotal().compareTo(subtotal) != 0) {
            throw new ValidationException("El subtotal debe coincidir con cantidad por precio unitario");
        }

        return subtotal;
    }

    private String normalizarUnidadDetalle(String unidadDetalle) {
        if (unidadDetalle == null) {
            throw new ValidationException("La unidad del detalle es obligatoria");
        }

        String valor = unidadDetalle.trim();
        if (DetallePedidoConstants.UNIDAD_PIEZAS.equalsIgnoreCase(valor)) {
            return DetallePedidoConstants.UNIDAD_PIEZAS;
        }
        if (DetallePedidoConstants.UNIDAD_METROS.equalsIgnoreCase(valor)) {
            return DetallePedidoConstants.UNIDAD_METROS;
        }
        if (DetallePedidoConstants.UNIDAD_LITROS.equalsIgnoreCase(valor)) {
            return DetallePedidoConstants.UNIDAD_LITROS;
        }

        throw new ValidationException("La unidad del detalle debe ser Piezas, Metros o Litros");
    }
}
