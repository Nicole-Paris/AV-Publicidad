package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.DetallePedidoConstants;
import avpublicidad.proyecto.dto.DetallePedidoRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.DetallePedido;
import avpublicidad.proyecto.repository.DetallePedidoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import avpublicidad.proyecto.repository.ServicioRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DetallePedidoService {

    private final DetallePedidoRepository detallePedidoRepository;
    private final PedidoRepository pedidoRepository;
    private final ServicioRepository servicioRepository;

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

        DetallePedido detallePedido = DetallePedido.builder()
                .cantidad(request.getCantidad())
                .precioUnitario(request.getPrecioUnitario())
                .subtotal(request.getSubtotal())
                .unidadDetalle(normalizarUnidadDetalle(request.getUnidadDetalle()))
                .pedidoId(request.getPedidoId())
                .servicioId(request.getServicioId())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return detallePedidoRepository.save(detallePedido);
    }

    public DetallePedido actualizar(Integer id, DetallePedidoRequest request) {
        DetallePedido detallePedido = obtenerPorId(id);
        validarRelaciones(request);

        detallePedido.setCantidad(request.getCantidad());
        detallePedido.setPrecioUnitario(request.getPrecioUnitario());
        detallePedido.setSubtotal(request.getSubtotal());
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
        detallePedido.setDeletedAt(LocalDateTime.now());
        detallePedidoRepository.save(detallePedido);
    }

    private void validarRelaciones(DetallePedidoRequest request) {
        if (request.getPedidoId() != null && !pedidoRepository.existsById(request.getPedidoId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado");
        }

        if (request.getServicioId() != null && !servicioRepository.existsById(request.getServicioId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Servicio no encontrado");
        }
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
