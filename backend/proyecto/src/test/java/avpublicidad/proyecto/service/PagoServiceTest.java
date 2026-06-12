package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.PagoConstants;
import avpublicidad.proyecto.constants.PedidoConstants;
import avpublicidad.proyecto.dto.PagoRequest;
import avpublicidad.proyecto.model.Pago;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.PagoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import jakarta.validation.ValidationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PagoServiceTest {

    @Mock
    private PagoRepository pagoRepository;

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private EmpleadoRepository empleadoRepository;

    @InjectMocks
    private PagoService pagoService;

    @Test
    void crear_conIntercambio_debeGuardarFormaPagoNormalizada() {
        PagoRequest request = requestValido();
        request.setFormaPago("intercambio");

        when(pedidoRepository.existsById(1)).thenReturn(true);
        when(empleadoRepository.existsById(1)).thenReturn(true);
        when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido(PedidoConstants.ESTADO_PENDIENTE)));
        when(pagoRepository.findByPedidoIdAndDeletedAtIsNull(1)).thenReturn(List.of());
        when(pagoRepository.save(any(Pago.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Pago pago = pagoService.crear(request);

        assertThat(pago.getFormaPago()).isEqualTo(PagoConstants.FORMA_PAGO_INTERCAMBIO);
    }

    @Test
    void crear_cuandoExcedeSaldo_debeRechazar() {
        PagoRequest request = requestValido();
        request.setMonto(new BigDecimal("600.00"));

        Pago pagoPrevio = Pago.builder().idPago(1).monto(new BigDecimal("950.00")).build();
        when(pedidoRepository.existsById(1)).thenReturn(true);
        when(empleadoRepository.existsById(1)).thenReturn(true);
        when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido(PedidoConstants.ESTADO_PENDIENTE)));
        when(pagoRepository.findByPedidoIdAndDeletedAtIsNull(1)).thenReturn(List.of(pagoPrevio));

        assertThatThrownBy(() -> pagoService.crear(request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("saldo pendiente");
    }

    @Test
    void crear_enPedidoCancelado_debeRechazar() {
        PagoRequest request = requestValido();

        when(pedidoRepository.existsById(1)).thenReturn(true);
        when(empleadoRepository.existsById(1)).thenReturn(true);
        when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido(PedidoConstants.ESTADO_CANCELADO)));

        assertThatThrownBy(() -> pagoService.crear(request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("pedidos cancelados");
    }

    @Test
    void crear_anticipoQueLiquidaPedido_debeSolicitarLiquidacion() {
        PagoRequest request = requestValido();
        request.setMonto(new BigDecimal("1500.00"));

        when(pedidoRepository.existsById(1)).thenReturn(true);
        when(empleadoRepository.existsById(1)).thenReturn(true);
        when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido(PedidoConstants.ESTADO_PENDIENTE)));
        when(pagoRepository.findByPedidoIdAndDeletedAtIsNull(1)).thenReturn(List.of());

        assertThatThrownBy(() -> pagoService.crear(request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("concepto Liquidacion");
    }

    @Test
    void crear_enPedidoPagado_debeRechazar() {
        PagoRequest request = requestValido();
        request.setMonto(new BigDecimal("10.00"));

        Pago pagoPrevio = Pago.builder().idPago(1).monto(new BigDecimal("1500.00")).build();
        when(pedidoRepository.existsById(1)).thenReturn(true);
        when(empleadoRepository.existsById(1)).thenReturn(true);
        when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedido(PedidoConstants.ESTADO_PENDIENTE)));
        when(pagoRepository.findByPedidoIdAndDeletedAtIsNull(1)).thenReturn(List.of(pagoPrevio));

        assertThatThrownBy(() -> pagoService.crear(request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("ya esta pagado");
    }

    private PagoRequest requestValido() {
        PagoRequest request = new PagoRequest();
        request.setMonto(new BigDecimal("500.00"));
        request.setFecha(LocalDate.of(2026, 5, 19));
        request.setHoraPago(LocalTime.of(13, 30));
        request.setReferencia("PAGO-001");
        request.setFormaPago(PagoConstants.FORMA_PAGO_EFECTIVO);
        request.setConceptoPago(PagoConstants.CONCEPTO_ANTICIPO);
        request.setPedidoId(1);
        request.setEmpleadoIdEmpleado(1);
        request.setCreatedBy(1);
        return request;
    }

    private Pedido pedido(String estado) {
        return Pedido.builder()
                .idPedido(1)
                .estado(estado)
                .total(new BigDecimal("1500.00"))
                .build();
    }
}
