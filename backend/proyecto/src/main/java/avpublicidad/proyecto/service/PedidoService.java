package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.PedidoConstants;
import avpublicidad.proyecto.dto.PedidoRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.repository.ClienteRepository;
import avpublicidad.proyecto.repository.DetallePedidoRepository;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.PagoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final EmpleadoRepository empleadoRepository;
    private final SucursalRepository sucursalRepository;
    private final PagoRepository pagoRepository;
    private final DetallePedidoRepository detallePedidoRepository;

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
        validarReglasNegocio(request);

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
        validarReglasNegocio(request);
        String estadoNuevo = normalizarEstado(request.getEstado());
        validarFlujoEstado(pedido.getEstado(), estadoNuevo);
        validarPedidoEditable(pedido, request);
        validarRequisitosEstado(pedido, estadoNuevo);

        pedido.setFechaPedido(request.getFechaPedido());
        pedido.setFechaEntrega(request.getFechaEntrega());
        pedido.setEstado(estadoNuevo);
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
        if (!pagoRepository.findByPedidoIdAndDeletedAtIsNull(id).isEmpty()) {
            throw new ValidationException("No se puede eliminar un pedido con pagos registrados; cancelalo");
        }
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

    private void validarReglasNegocio(PedidoRequest request) {
        if (request.getFechaPedido() != null
                && request.getFechaEntrega() != null
                && request.getFechaEntrega().isBefore(request.getFechaPedido())) {
            throw new ValidationException("La fecha de entrega no puede ser anterior a la fecha del pedido");
        }

        if (request.getTotal() == null || request.getTotal().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("El total del pedido debe capturarse manualmente y ser mayor a cero");
        }

        String estado = normalizarEstado(request.getEstado());
        if (PedidoConstants.ESTADO_CANCELADO.equals(estado)
                && (request.getMotivoCancelacion() == null || request.getMotivoCancelacion().isBlank())) {
            throw new ValidationException("El motivo de cancelacion es obligatorio cuando el pedido esta cancelado");
        }
    }

    private void validarFlujoEstado(String estadoActual, String estadoNuevo) {
        if (estadoActual == null || estadoActual.equals(estadoNuevo)) {
            return;
        }

        boolean transicionValida =
                (PedidoConstants.ESTADO_BORRADOR.equals(estadoActual)
                        && (PedidoConstants.ESTADO_PENDIENTE.equals(estadoNuevo)
                        || PedidoConstants.ESTADO_CANCELADO.equals(estadoNuevo)))
                        || (PedidoConstants.ESTADO_PENDIENTE.equals(estadoActual)
                        && (PedidoConstants.ESTADO_EN_PROCESO.equals(estadoNuevo)
                        || PedidoConstants.ESTADO_CANCELADO.equals(estadoNuevo)))
                        || (PedidoConstants.ESTADO_EN_PROCESO.equals(estadoActual)
                        && (PedidoConstants.ESTADO_TERMINADO.equals(estadoNuevo)
                        || PedidoConstants.ESTADO_CANCELADO.equals(estadoNuevo)))
                        || (PedidoConstants.ESTADO_TERMINADO.equals(estadoActual)
                        && PedidoConstants.ESTADO_ENTREGADO.equals(estadoNuevo));

        if (!transicionValida) {
            throw new ValidationException("El pedido no puede cambiar de " + estadoActual + " a " + estadoNuevo);
        }
    }

    private void validarPedidoEditable(Pedido pedido, PedidoRequest request) {
        if (PedidoConstants.ESTADO_BORRADOR.equals(pedido.getEstado())
                || PedidoConstants.ESTADO_PENDIENTE.equals(pedido.getEstado())) {
            return;
        }

        boolean cambioDatosBase = !pedido.getClienteId().equals(request.getClienteId())
                || !pedido.getEmpleadoId().equals(request.getEmpleadoId())
                || !pedido.getSucursalId().equals(request.getSucursalId());

        if (cambioDatosBase) {
            throw new ValidationException("No se puede cambiar cliente, empleado o sucursal cuando el pedido ya esta en proceso");
        }
    }

    private void validarRequisitosEstado(Pedido pedido, String estadoNuevo) {
        if (!PedidoConstants.ESTADO_BORRADOR.equals(estadoNuevo)
                && detallePedidoRepository.findByPedidoIdAndDeletedAtIsNull(pedido.getIdPedido()).isEmpty()) {
            throw new ValidationException("El pedido debe tener al menos un detalle para avanzar de estado");
        }

        if (PedidoConstants.ESTADO_ENTREGADO.equals(estadoNuevo)
                && calcularTotalPagado(pedido.getIdPedido()).compareTo(pedido.getTotal()) < 0) {
            throw new ValidationException("No se puede entregar un pedido con saldo pendiente");
        }
    }

    private BigDecimal calcularTotalPagado(Integer pedidoId) {
        return pagoRepository.findByPedidoIdAndDeletedAtIsNull(pedidoId).stream()
                .map(pago -> pago.getMonto() == null ? BigDecimal.ZERO : pago.getMonto())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
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
        if (PedidoConstants.FORMA_PAGO_INTERCAMBIO.equalsIgnoreCase(valor)) {
            return PedidoConstants.FORMA_PAGO_INTERCAMBIO;
        }

        throw new ValidationException("La forma de pago debe ser Contado, Credito o Intercambio");
    }
}
