package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.PedidoConstants;
import avpublicidad.proyecto.dto.DetallePedidoRequest;
import avpublicidad.proyecto.model.DetallePedido;
import avpublicidad.proyecto.model.Inventario;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.model.ServicioMaterial;
import avpublicidad.proyecto.repository.DetallePedidoRepository;
import avpublicidad.proyecto.repository.InventarioRepository;
import avpublicidad.proyecto.repository.MovimientoInventarioRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import avpublicidad.proyecto.repository.ServicioMaterialRepository;
import avpublicidad.proyecto.repository.ServicioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DetallePedidoServiceTest {

    @Mock
    private DetallePedidoRepository detallePedidoRepository;

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private ServicioRepository servicioRepository;

    @Mock
    private ServicioMaterialRepository servicioMaterialRepository;

    @Mock
    private InventarioRepository inventarioRepository;

    @Mock
    private MovimientoInventarioRepository movimientoInventarioRepository;

    @InjectMocks
    private DetallePedidoService detallePedidoService;

    @Test
    void crear_debeDisminuirInventarioSegunMaterialUsado() {
        DetallePedidoRequest request = new DetallePedidoRequest();
        request.setCantidad(new BigDecimal("2"));
        request.setPrecioUnitario(new BigDecimal("500.00"));
        request.setSubtotal(new BigDecimal("1000.00"));
        request.setUnidadDetalle("Piezas");
        request.setPedidoId(1);
        request.setServicioId(7);
        request.setCreatedBy(9);

        when(pedidoRepository.existsById(1)).thenReturn(true);
        when(servicioRepository.existsById(7)).thenReturn(true);
        when(pedidoRepository.findById(1)).thenReturn(Optional.of(Pedido.builder()
                .idPedido(1)
                .estado(PedidoConstants.ESTADO_PENDIENTE)
                .sucursalId(5)
                .deletedAt(null)
                .build()));
        when(detallePedidoRepository.save(any(DetallePedido.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(servicioMaterialRepository.findByDeletedAtIsNull()).thenReturn(List.of(ServicioMaterial.builder()
                .servicioId(7)
                .materialId(3)
                .cantidadUsada(new BigDecimal("1.50"))
                .build()));
        when(inventarioRepository.findByMaterialIdAndSucursalIdAndDeletedAtIsNull(3, 5))
                .thenReturn(Optional.of(Inventario.builder()
                        .idInventario(11)
                        .materialId(3)
                        .sucursalId(5)
                        .stockActual(new BigDecimal("10.00"))
                        .build()));

        detallePedidoService.crear(request);

        verify(inventarioRepository).save(argThat(item -> item.getStockActual().compareTo(new BigDecimal("7.00")) == 0));
        verify(movimientoInventarioRepository).save(argThat(movimiento ->
                "Salida".equals(movimiento.getTipo())
                        && movimiento.getInventarioId().equals(11)
                        && movimiento.getCreatedBy().equals(9)
        ));
    }
}
