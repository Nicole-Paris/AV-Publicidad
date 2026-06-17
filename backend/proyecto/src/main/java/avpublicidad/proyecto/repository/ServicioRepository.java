package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServicioRepository extends JpaRepository<Servicio, Integer> {

    List<Servicio> findByDeletedAtIsNull();
}
