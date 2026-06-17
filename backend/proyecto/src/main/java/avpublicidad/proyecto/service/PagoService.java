package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.PagoConstants;
import avpublicidad.proyecto.constants.PedidoConstants;
import avpublicidad.proyecto.dto.PagoRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Cliente;
import avpublicidad.proyecto.model.Pago;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.repository.ClienteRepository;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.PagoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
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
public class PagoService {

    private final PagoRepository pagoRepository;
    private final PedidoRepository pedidoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final ClienteRepository clienteRepository;

    public List<Pago> listar() {
        return pagoRepository.findByDeletedAtIsNull();
    }

    public Pago obtenerPorId(Integer id) {
        return pagoRepository.findById(id)
                .filter(pago -> pago.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado"));
    }

    @Transactional
    public Pago crear(PagoRequest request) {
        validarRelaciones(request);
        validarReglasNegocio(request, null);

        Pago pago = Pago.builder()
                .monto(request.getMonto())
                .fecha(request.getFecha())
                .horaPago(request.getHoraPago())
                .referencia(request.getReferencia())
                .formaPago(normalizarFormaPago(request.getFormaPago()))
                .conceptoPago(normalizarConceptoPago(request.getConceptoPago()))
                .pedidoId(request.getPedidoId())
                .empleadoIdEmpleado(request.getEmpleadoIdEmpleado())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        Pago pagoGuardado = pagoRepository.save(pago);
        aplicarPagoACreditoCliente(pagoGuardado);

        return pagoGuardado;
    }

    @Transactional
    public Pago actualizar(Integer id, PagoRequest request) {
        Pago pago = obtenerPorId(id);
        Pago pagoAnterior = copiarPago(pago);
        validarRelaciones(request);
        validarReglasNegocio(request, id);

        pago.setMonto(request.getMonto());
        pago.setFecha(request.getFecha());
        pago.setHoraPago(request.getHoraPago());
        pago.setReferencia(request.getReferencia());
        pago.setFormaPago(normalizarFormaPago(request.getFormaPago()));
        pago.setConceptoPago(normalizarConceptoPago(request.getConceptoPago()));
        pago.setPedidoId(request.getPedidoId());
        pago.setEmpleadoIdEmpleado(request.getEmpleadoIdEmpleado());
        pago.setCreatedBy(request.getCreatedBy());
        pago.setUpdatedBy(request.getUpdatedBy());
        pago.setDeletedBy(request.getDeletedBy());

        Pago pagoGuardado = pagoRepository.save(pago);
        revertirPagoACreditoCliente(pagoAnterior);
        aplicarPagoACreditoCliente(pagoGuardado);

        return pagoGuardado;
    }

    @Transactional
    public void eliminar(Integer id) {
        Pago pago = obtenerPorId(id);
        pago.setDeletedAt(LocalDateTime.now());
        pagoRepository.save(pago);
        revertirPagoACreditoCliente(pago);
    }

    private void validarRelaciones(PagoRequest request) {
        if (request.getPedidoId() != null && !pedidoRepository.existsById(request.getPedidoId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado");
        }

        if (request.getEmpleadoIdEmpleado() != null && !empleadoRepository.existsById(request.getEmpleadoIdEmpleado())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado");
        }
    }

    private void validarReglasNegocio(PagoRequest request, Integer pagoActualId) {
        if (request.getPedidoId() == null || request.getMonto() == null) {
            return;
        }

        Pedido pedido = pedidoRepository.findById(request.getPedidoId())
                .filter(pedidoEncontrado -> pedidoEncontrado.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));

        if (PedidoConstants.ESTADO_CANCELADO.equalsIgnoreCase(pedido.getEstado())) {
            throw new ValidationException("No se pueden registrar pagos en pedidos cancelados");
        }
        if (PedidoConstants.ESTADO_ENTREGADO.equalsIgnoreCase(pedido.getEstado())) {
            throw new ValidationException("No se pueden registrar pagos en pedidos entregados");
        }

        if (request.getFecha() != null && pedido.getFechaPedido() != null
                && request.getFecha().isBefore(pedido.getFechaPedido().toLocalDate())) {
            throw new ValidationException("La fecha del pago no puede ser anterior a la fecha del pedido");
        }

        BigDecimal totalPagado = pagoRepository.findByPedidoIdAndDeletedAtIsNull(request.getPedidoId()).stream()
                .filter(pago -> pagoActualId == null || !pagoActualId.equals(pago.getIdPago()))
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saldoPendiente = pedido.getTotal().subtract(totalPagado);

        BigDecimal nuevoTotalPagado = totalPagado.add(request.getMonto());
        if (nuevoTotalPagado.compareTo(pedido.getTotal()) > 0) {
            throw new ValidationException("El pago excede el saldo pendiente del pedido");
        }

        validarConceptoPago(request, saldoPendiente, totalPagado);
    }

    private void validarConceptoPago(PagoRequest request, BigDecimal saldoPendiente, BigDecimal totalPagado) {
        String concepto = normalizarConceptoPago(request.getConceptoPago());

        if (PagoConstants.CONCEPTO_ANTICIPO.equals(concepto) && totalPagado.compareTo(BigDecimal.ZERO) > 0) {
            throw new ValidationException("El anticipo solo puede registrarse como primer pago");
        }

        if (PagoConstants.CONCEPTO_LIQUIDACION.equals(concepto)
                && request.getMonto().compareTo(saldoPendiente) != 0) {
            throw new ValidationException("La liquidacion debe cubrir exactamente el saldo pendiente");
        }

        if (PagoConstants.CONCEPTO_ABONO.equals(concepto)
                && request.getMonto().compareTo(saldoPendiente) >= 0) {
            throw new ValidationException("El abono debe ser menor al saldo pendiente; usa liquidacion para cubrir el total");
        }

        if (PagoConstants.CONCEPTO_ABONO_CREDITO.equals(concepto)
                && request.getMonto().compareTo(saldoPendiente) >= 0) {
            throw new ValidationException("El abono a credito debe ser menor al saldo pendiente");
        }
    }

    private void aplicarPagoACreditoCliente(Pago pago) {
        ajustarCreditoClientePorPago(pago, true);
    }

    private void revertirPagoACreditoCliente(Pago pago) {
        ajustarCreditoClientePorPago(pago, false);
    }

    private void ajustarCreditoClientePorPago(Pago pago, boolean descontar) {
        Pedido pedido = pedidoRepository.findById(pago.getPedidoId())
                .filter(pedidoEncontrado -> pedidoEncontrado.getDeletedAt() == null)
                .orElse(null);

        if (pedido == null || !PedidoConstants.FORMA_PAGO_CREDITO.equals(pedido.getFormaPago())) {
            return;
        }

        Cliente cliente = clienteRepository.findById(pedido.getClienteId())
                .filter(clienteEncontrado -> clienteEncontrado.getDeletedAt() == null)
                .orElse(null);

        if (cliente == null) {
            return;
        }

        BigDecimal creditoActual = cliente.getCreditoActual() == null ? BigDecimal.ZERO : cliente.getCreditoActual();
        BigDecimal monto = pago.getMonto() == null ? BigDecimal.ZERO : pago.getMonto();
        BigDecimal nuevoCredito = descontar ? creditoActual.subtract(monto) : creditoActual.add(monto);

        if (nuevoCredito.compareTo(BigDecimal.ZERO) < 0) {
            nuevoCredito = BigDecimal.ZERO;
        }

        cliente.setCreditoActual(nuevoCredito);
        clienteRepository.save(cliente);
    }

    private Pago copiarPago(Pago pago) {
        return Pago.builder()
                .idPago(pago.getIdPago())
                .monto(pago.getMonto())
                .fecha(pago.getFecha())
                .horaPago(pago.getHoraPago())
                .referencia(pago.getReferencia())
                .formaPago(pago.getFormaPago())
                .conceptoPago(pago.getConceptoPago())
                .pedidoId(pago.getPedidoId())
                .empleadoIdEmpleado(pago.getEmpleadoIdEmpleado())
                .createdBy(pago.getCreatedBy())
                .updatedBy(pago.getUpdatedBy())
                .deletedBy(pago.getDeletedBy())
                .build();
    }

    private String normalizarFormaPago(String formaPago) {
        if (formaPago == null) {
            throw new ValidationException("La forma de pago es obligatoria");
        }

        String valor = formaPago.trim();
        if (PagoConstants.FORMA_PAGO_EFECTIVO.equalsIgnoreCase(valor)) {
            return PagoConstants.FORMA_PAGO_EFECTIVO;
        }
        if (PagoConstants.FORMA_PAGO_TRANSFERENCIA.equalsIgnoreCase(valor)) {
            return PagoConstants.FORMA_PAGO_TRANSFERENCIA;
        }
        if (PagoConstants.FORMA_PAGO_INTERCAMBIO.equalsIgnoreCase(valor)) {
            return PagoConstants.FORMA_PAGO_INTERCAMBIO;
        }

        throw new ValidationException("La forma de pago debe ser Efectivo, Transferencia o Intercambio");
    }

    private String normalizarConceptoPago(String conceptoPago) {
        if (conceptoPago == null) {
            throw new ValidationException("El concepto de pago es obligatorio");
        }

        String valor = conceptoPago.trim();
        if (PagoConstants.CONCEPTO_ANTICIPO.equalsIgnoreCase(valor)) {
            return PagoConstants.CONCEPTO_ANTICIPO;
        }
        if (PagoConstants.CONCEPTO_ABONO_CREDITO.equalsIgnoreCase(valor)) {
            return PagoConstants.CONCEPTO_ABONO_CREDITO;
        }
        if (PagoConstants.CONCEPTO_LIQUIDACION.equalsIgnoreCase(valor)) {
            return PagoConstants.CONCEPTO_LIQUIDACION;
        }
        if (PagoConstants.CONCEPTO_ABONO.equalsIgnoreCase(valor)) {
            return PagoConstants.CONCEPTO_ABONO;
        }

        throw new ValidationException("El concepto de pago no es valido");
    }
}
