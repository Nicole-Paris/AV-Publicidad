package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.Material;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaterialRepository extends JpaRepository<Material, Integer> {

    List<Material> findByDeletedAtIsNull();
}
