package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.Material;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MaterialRepository extends JpaRepository<Material, Integer> {

    List<Material> findByDeletedAtIsNull();

    Optional<Material> findByNombreIgnoreCaseAndDeletedAtIsNull(String nombre);

    boolean existsByCategoriaMaterialIdAndDeletedAtIsNull(Integer categoriaMaterialId);
}
