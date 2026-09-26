package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PagoRepository extends JpaRepository<Pago, Integer> {

    List<Pago> findByDeletedAtIsNull();

    List<Pago> findByPedidoIdAndDeletedAtIsNull(Integer pedidoId);

    List<Pago> findByEmpleadoIdEmpleadoAndFechaAndDeletedAtIsNull(Integer empleadoIdEmpleado, LocalDate fecha);
}
