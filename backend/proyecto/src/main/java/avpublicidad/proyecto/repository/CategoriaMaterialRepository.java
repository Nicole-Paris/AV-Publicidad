package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.CategoriaMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaMaterialRepository extends JpaRepository<CategoriaMaterial, Integer> {

    List<CategoriaMaterial> findByDeletedAtIsNull();

    Optional<CategoriaMaterial> findByNombreIgnoreCaseAndDeletedAtIsNull(String nombre);
}
