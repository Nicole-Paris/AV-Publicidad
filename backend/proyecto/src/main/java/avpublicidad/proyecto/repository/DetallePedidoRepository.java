package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.DetallePedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DetallePedidoRepository extends JpaRepository<DetallePedido, Integer> {

    List<DetallePedido> findByDeletedAtIsNull();

    List<DetallePedido> findByPedidoIdAndDeletedAtIsNull(Integer pedidoId);

    @Query("""
            select count(detalle)
            from DetallePedido detalle
            join Pedido pedido on pedido.idPedido = detalle.pedidoId
            where detalle.servicioId = :servicioId
              and detalle.deletedAt is null
              and pedido.deletedAt is null
              and pedido.estado not in :estadosPermitidos
            """)
    long countPedidosActivosPorServicio(
            @Param("servicioId") Integer servicioId,
            @Param("estadosPermitidos") List<String> estadosPermitidos
    );

    @Query("""
            select count(detalle)
            from DetallePedido detalle
            join Pedido pedido on pedido.idPedido = detalle.pedidoId
            join ServicioMaterial servicioMaterial on servicioMaterial.servicioId = detalle.servicioId
            where servicioMaterial.materialId = :materialId
              and servicioMaterial.deletedAt is null
              and detalle.deletedAt is null
              and pedido.deletedAt is null
              and pedido.estado not in :estadosPermitidos
            """)
    long countPedidosActivosPorMaterial(
            @Param("materialId") Integer materialId,
            @Param("estadosPermitidos") List<String> estadosPermitidos
    );
}
