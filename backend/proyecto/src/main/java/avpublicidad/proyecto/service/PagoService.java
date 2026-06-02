package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.PagoConstants;
import avpublicidad.proyecto.constants.PedidoConstants;
import avpublicidad.proyecto.dto.PagoRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Pago;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.PagoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
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
public class PagoService {

    private final PagoRepository pagoRepository;
    private final PedidoRepository pedidoRepository;
    private final EmpleadoRepository empleadoRepository;

    public List<Pago> listar() {
        return pagoRepository.findByDeletedAtIsNull();
    }

    public Pago obtenerPorId(Integer id) {
        return pagoRepository.findById(id)
                .filter(pago -> pago.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado"));
    }

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

        return pagoRepository.save(pago);
    }

    public Pago actualizar(Integer id, PagoRequest request) {
        Pago pago = obtenerPorId(id);
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

        return pagoRepository.save(pago);
    }

    public void eliminar(Integer id) {
        Pago pago = obtenerPorId(id);
        pago.setDeletedAt(LocalDateTime.now());
        pagoRepository.save(pago);
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
