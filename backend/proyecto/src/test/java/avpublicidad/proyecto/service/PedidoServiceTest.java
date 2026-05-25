package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.PedidoConstants;
import avpublicidad.proyecto.dto.PedidoRequest;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.repository.ClienteRepository;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import jakarta.validation.ValidationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PedidoServiceTest {

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private EmpleadoRepository empleadoRepository;

    @Mock
    private SucursalRepository sucursalRepository;

    @InjectMocks
    private PedidoService pedidoService;

    @Test
    void crear_conIntercambio_debeGuardarFormaPagoNormalizada() {
        PedidoRequest request = requestValido();
        request.setFormaPago("intercambio");

        when(clienteRepository.existsById(1)).thenReturn(true);
        when(empleadoRepository.existsById(1)).thenReturn(true);
        when(sucursalRepository.existsById(1)).thenReturn(true);
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Pedido pedido = pedidoService.crear(request);

        assertThat(pedido.getFormaPago()).isEqualTo(PedidoConstants.FORMA_PAGO_INTERCAMBIO);
    }

    @Test
    void crear_conTotalCero_debeRechazarPorqueElPrecioEsManual() {
        PedidoRequest request = requestValido();
        request.setTotal(BigDecimal.ZERO);
        relacionesExistentes();

        assertThatThrownBy(() -> pedidoService.crear(request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("capturarse manualmente");
    }

    @Test
    void crear_conFechaEntregaAnterior_debeRechazar() {
        PedidoRequest request = requestValido();
        request.setFechaEntrega(LocalDateTime.of(2026, 5, 18, 18, 0));
        relacionesExistentes();

        assertThatThrownBy(() -> pedidoService.crear(request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("fecha de entrega");
    }

    @Test
    void crear_canceladoSinMotivo_debeRechazar() {
        PedidoRequest request = requestValido();
        request.setEstado(PedidoConstants.ESTADO_CANCELADO);
        relacionesExistentes();

        assertThatThrownBy(() -> pedidoService.crear(request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("motivo de cancelacion");
    }

    private PedidoRequest requestValido() {
        PedidoRequest request = new PedidoRequest();
        request.setFechaPedido(LocalDateTime.of(2026, 5, 19, 10, 0));
        request.setFechaEntrega(LocalDateTime.of(2026, 5, 20, 18, 0));
        request.setEstado(PedidoConstants.ESTADO_PENDIENTE);
        request.setTotal(new BigDecimal("1500.00"));
        request.setDescripcion("Pedido de lona");
        request.setTipoPedido(PedidoConstants.TIPO_PEDIDO);
        request.setFormaPago(PedidoConstants.FORMA_PAGO_CONTADO);
        request.setClienteId(1);
        request.setEmpleadoId(1);
        request.setSucursalId(1);
        request.setCreatedBy(1);
        return request;
    }

    private void relacionesExistentes() {
        when(clienteRepository.existsById(1)).thenReturn(true);
        when(empleadoRepository.existsById(1)).thenReturn(true);
        when(sucursalRepository.existsById(1)).thenReturn(true);
    }
}
