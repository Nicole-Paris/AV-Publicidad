package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.PagoConstants;
import avpublicidad.proyecto.dto.PagoRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Pago;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.PagoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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

        throw new ValidationException("La forma de pago debe ser Efectivo o Transferencia");
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
        if (PagoConstants.CONCEPTO_PAGO_TOTAL.equalsIgnoreCase(valor)) {
            return PagoConstants.CONCEPTO_PAGO_TOTAL;
        }

        throw new ValidationException("El concepto de pago no es valido");
    }
}
