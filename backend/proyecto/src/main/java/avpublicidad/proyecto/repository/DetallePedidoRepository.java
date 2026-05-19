package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.DetallePedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetallePedidoRepository extends JpaRepository<DetallePedido, Integer> {

    List<DetallePedido> findByDeletedAtIsNull();
}
