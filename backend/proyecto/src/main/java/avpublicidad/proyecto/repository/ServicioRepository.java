package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServicioRepository extends JpaRepository<Servicio, Integer> {

    List<Servicio> findByDeletedAtIsNull();

    Optional<Servicio> findByNombreIgnoreCaseAndDeletedAtIsNull(String nombre);

    boolean existsByCategoriaServicioIdAndDeletedAtIsNull(Integer categoriaServicioId);
}
