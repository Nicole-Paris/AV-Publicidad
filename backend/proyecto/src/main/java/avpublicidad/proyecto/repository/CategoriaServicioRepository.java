package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.CategoriaServicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoriaServicioRepository extends JpaRepository<CategoriaServicio, Integer> {

    List<CategoriaServicio> findByDeletedAtIsNull();
}
