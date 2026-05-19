package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PagoRepository extends JpaRepository<Pago, Integer> {

    List<Pago> findByDeletedAtIsNull();
}
