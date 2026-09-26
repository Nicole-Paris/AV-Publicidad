package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.CategoriaMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoriaMaterialRepository extends JpaRepository<CategoriaMaterial, Integer> {

    List<CategoriaMaterial> findByDeletedAtIsNull();
}
