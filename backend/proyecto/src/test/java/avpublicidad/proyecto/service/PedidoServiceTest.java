package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.PedidoConstants;
import avpublicidad.proyecto.dto.PedidoRequest;
import avpublicidad.proyecto.model.DetallePedido;
import avpublicidad.proyecto.model.Inventario;
import avpublicidad.proyecto.model.Pago;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.model.ServicioMaterial;
import avpublicidad.proyecto.repository.ClienteRepository;
import avpublicidad.proyecto.repository.DetallePedidoRepository;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.InventarioRepository;
import avpublicidad.proyecto.repository.MovimientoInventarioRepository;
import avpublicidad.proyecto.repository.PagoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import avpublicidad.proyecto.repository.ServicioMaterialRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import jakarta.validation.ValidationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
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

    @Mock
    private PagoRepository pagoRepository;

    @Mock
    private DetallePedidoRepository detallePedidoRepository;

    @Mock
    private ServicioMaterialRepository servicioMaterialRepository;

    @Mock
    private InventarioRepository inventarioRepository;

    @Mock
    private MovimientoInventarioRepository movimientoInventarioRepository;

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

    @Test
    void actualizar_dePendienteAEnProceso_debePermitirFlujoValido() {
        PedidoRequest request = requestValido();
        request.setEstado(PedidoConstants.ESTADO_EN_PROCESO);
        relacionesExistentes();
        when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedidoExistente(PedidoConstants.ESTADO_PENDIENTE)));
        when(detallePedidoRepository.findByPedidoIdAndDeletedAtIsNull(1)).thenReturn(List.of(detallePedido()));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Pedido pedido = pedidoService.actualizar(1, request);

        assertThat(pedido.getEstado()).isEqualTo(PedidoConstants.ESTADO_EN_PROCESO);
    }

    @Test
    void actualizar_dePendienteAEntregado_debeRechazarSaltoDeEstado() {
        PedidoRequest request = requestValido();
        request.setEstado(PedidoConstants.ESTADO_ENTREGADO);
        relacionesExistentes();
        when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedidoExistente(PedidoConstants.ESTADO_PENDIENTE)));

        assertThatThrownBy(() -> pedidoService.actualizar(1, request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("no puede cambiar");
    }

    @Test
    void actualizar_aCancelado_debeRestaurarInventarioYEliminarPagos() {
        PedidoRequest request = requestValido();
        request.setEstado(PedidoConstants.ESTADO_CANCELADO);
        request.setMotivoCancelacion("Cliente desistió");
        request.setSucursalId(5);
        request.setUpdatedBy(9);
        relacionesExistentes();
        when(sucursalRepository.existsById(5)).thenReturn(true);

        Pedido pedidoExistente = pedidoExistente(PedidoConstants.ESTADO_PENDIENTE);
        pedidoExistente.setSucursalId(5);

        DetallePedido detalle = detallePedido();
        detalle.setServicioId(7);
        detalle.setCantidad(new BigDecimal("2"));

        Inventario inventario = Inventario.builder()
                .idInventario(11)
                .materialId(3)
                .sucursalId(5)
                .stockActual(new BigDecimal("10.00"))
                .build();

        ServicioMaterial servicioMaterial = ServicioMaterial.builder()
                .servicioId(7)
                .materialId(3)
                .cantidadUsada(new BigDecimal("1.50"))
                .build();

        Pago pago = Pago.builder()
                .idPago(22)
                .pedidoId(1)
                .monto(new BigDecimal("100.00"))
                .deletedAt(null)
                .build();

        when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedidoExistente));
        when(detallePedidoRepository.findByPedidoIdAndDeletedAtIsNull(1)).thenReturn(List.of(detalle));
        when(servicioMaterialRepository.findByDeletedAtIsNull()).thenReturn(List.of(servicioMaterial));
        when(inventarioRepository.findByMaterialIdAndSucursalIdAndDeletedAtIsNull(3, 5)).thenReturn(Optional.of(inventario));
        when(pagoRepository.findByPedidoIdAndDeletedAtIsNull(1)).thenReturn(List.of(pago));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pagoRepository.save(any(Pago.class))).thenAnswer(invocation -> invocation.getArgument(0));

        pedidoService.actualizar(1, request);

        verify(inventarioRepository).save(argThat(item -> item.getStockActual().compareTo(new BigDecimal("13.00")) == 0));
        verify(pagoRepository).save(argThat(item -> item.getDeletedAt() != null && item.getDeletedBy().equals(9)));
    }

    @Test
    void actualizar_deCanceladoAPendiente_debeRechazarPorqueCanceladoEsFinal() {
        PedidoRequest request = requestValido();
        request.setEstado(PedidoConstants.ESTADO_PENDIENTE);
        relacionesExistentes();
        when(pedidoRepository.findById(1)).thenReturn(Optional.of(pedidoExistente(PedidoConstants.ESTADO_CANCELADO)));

        assertThatThrownBy(() -> pedidoService.actualizar(1, request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("no puede cambiar");
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
        lenient().when(clienteRepository.existsById(1)).thenReturn(true);
        lenient().when(empleadoRepository.existsById(1)).thenReturn(true);
        lenient().when(sucursalRepository.existsById(1)).thenReturn(true);
        lenient().when(sucursalRepository.existsById(5)).thenReturn(true);
    }

    private Pedido pedidoExistente(String estado) {
        return Pedido.builder()
                .idPedido(1)
                .fechaPedido(LocalDateTime.of(2026, 5, 19, 10, 0))
                .fechaEntrega(LocalDateTime.of(2026, 5, 20, 18, 0))
                .estado(estado)
                .total(new BigDecimal("1500.00"))
                .clienteId(1)
                .empleadoId(1)
                .sucursalId(1)
                .createdBy(1)
                .build();
    }

    private DetallePedido detallePedido() {
        return DetallePedido.builder()
                .idDetallePedido(1)
                .pedidoId(1)
                .subtotal(new BigDecimal("1500.00"))
                .build();
    }
}
