package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.PedidoConstants;
import avpublicidad.proyecto.dto.PedidoRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.repository.ClienteRepository;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final EmpleadoRepository empleadoRepository;
    private final SucursalRepository sucursalRepository;

    public List<Pedido> listar() {
        return pedidoRepository.findByDeletedAtIsNull();
    }

    public Pedido obtenerPorId(Integer id) {
        return pedidoRepository.findById(id)
                .filter(pedido -> pedido.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));
    }

    public Pedido crear(PedidoRequest request) {
        validarRelaciones(request);

        Pedido pedido = Pedido.builder()
                .fechaPedido(request.getFechaPedido())
                .fechaEntrega(request.getFechaEntrega())
                .estado(normalizarEstado(request.getEstado()))
                .total(request.getTotal())
                .descripcion(request.getDescripcion())
                .tipoPedido(normalizarTipoPedido(request.getTipoPedido()))
                .formaPago(normalizarFormaPago(request.getFormaPago()))
                .motivoCancelacion(request.getMotivoCancelacion())
                .clienteId(request.getClienteId())
                .empleadoId(request.getEmpleadoId())
                .sucursalId(request.getSucursalId())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return pedidoRepository.save(pedido);
    }

    public Pedido actualizar(Integer id, PedidoRequest request) {
        Pedido pedido = obtenerPorId(id);
        validarRelaciones(request);

        pedido.setFechaPedido(request.getFechaPedido());
        pedido.setFechaEntrega(request.getFechaEntrega());
        pedido.setEstado(normalizarEstado(request.getEstado()));
        pedido.setTotal(request.getTotal());
        pedido.setDescripcion(request.getDescripcion());
        pedido.setTipoPedido(normalizarTipoPedido(request.getTipoPedido()));
        pedido.setFormaPago(normalizarFormaPago(request.getFormaPago()));
        pedido.setMotivoCancelacion(request.getMotivoCancelacion());
        pedido.setClienteId(request.getClienteId());
        pedido.setEmpleadoId(request.getEmpleadoId());
        pedido.setSucursalId(request.getSucursalId());
        pedido.setCreatedBy(request.getCreatedBy());
        pedido.setUpdatedBy(request.getUpdatedBy());
        pedido.setDeletedBy(request.getDeletedBy());

        return pedidoRepository.save(pedido);
    }

    public void eliminar(Integer id) {
        Pedido pedido = obtenerPorId(id);
        pedido.setDeletedAt(LocalDateTime.now());
        pedidoRepository.save(pedido);
    }

    private void validarRelaciones(PedidoRequest request) {
        if (request.getClienteId() != null && !clienteRepository.existsById(request.getClienteId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado");
        }

        if (request.getEmpleadoId() != null && !empleadoRepository.existsById(request.getEmpleadoId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado");
        }

        if (request.getSucursalId() != null && !sucursalRepository.existsById(request.getSucursalId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada");
        }
    }

    private String normalizarEstado(String estado) {
        if (estado == null) {
            throw new ValidationException("El estado es obligatorio");
        }

        String valor = estado.trim();
        if (PedidoConstants.ESTADO_BORRADOR.equalsIgnoreCase(valor)) {
            return PedidoConstants.ESTADO_BORRADOR;
        }
        if (PedidoConstants.ESTADO_PENDIENTE.equalsIgnoreCase(valor)) {
            return PedidoConstants.ESTADO_PENDIENTE;
        }
        if (PedidoConstants.ESTADO_EN_PROCESO.equalsIgnoreCase(valor)) {
            return PedidoConstants.ESTADO_EN_PROCESO;
        }
        if (PedidoConstants.ESTADO_TERMINADO.equalsIgnoreCase(valor)) {
            return PedidoConstants.ESTADO_TERMINADO;
        }
        if (PedidoConstants.ESTADO_ENTREGADO.equalsIgnoreCase(valor)) {
            return PedidoConstants.ESTADO_ENTREGADO;
        }
        if (PedidoConstants.ESTADO_CANCELADO.equalsIgnoreCase(valor)) {
            return PedidoConstants.ESTADO_CANCELADO;
        }

        throw new ValidationException("El estado del pedido no es valido");
    }

    private String normalizarTipoPedido(String tipoPedido) {
        if (tipoPedido == null || tipoPedido.isBlank()) {
            return null;
        }

        String valor = tipoPedido.trim();
        if (PedidoConstants.TIPO_COTIZACION.equalsIgnoreCase(valor)) {
            return PedidoConstants.TIPO_COTIZACION;
        }
        if (PedidoConstants.TIPO_PEDIDO.equalsIgnoreCase(valor)) {
            return PedidoConstants.TIPO_PEDIDO;
        }

        throw new ValidationException("El tipo de pedido debe ser Cotizacion o Pedido");
    }

    private String normalizarFormaPago(String formaPago) {
        if (formaPago == null) {
            throw new ValidationException("La forma de pago es obligatoria");
        }

        String valor = formaPago.trim();
        if (PedidoConstants.FORMA_PAGO_CONTADO.equalsIgnoreCase(valor)) {
            return PedidoConstants.FORMA_PAGO_CONTADO;
        }
        if (PedidoConstants.FORMA_PAGO_CREDITO.equalsIgnoreCase(valor)) {
            return PedidoConstants.FORMA_PAGO_CREDITO;
        }

        throw new ValidationException("La forma de pago debe ser Contado o Credito");
    }
}
