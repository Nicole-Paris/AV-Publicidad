package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.CategoriaServicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaServicioRepository extends JpaRepository<CategoriaServicio, Integer> {

    List<CategoriaServicio> findByDeletedAtIsNull();

    Optional<CategoriaServicio> findByNombreIgnoreCaseAndDeletedAtIsNull(String nombre);
}
