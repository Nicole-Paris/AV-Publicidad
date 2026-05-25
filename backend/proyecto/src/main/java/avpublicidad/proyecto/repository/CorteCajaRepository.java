package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.CorteCaja;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CorteCajaRepository extends JpaRepository<CorteCaja, Integer> {

    List<CorteCaja> findByDeletedAtIsNull();
}
