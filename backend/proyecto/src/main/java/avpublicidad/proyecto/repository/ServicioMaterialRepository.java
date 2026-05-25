package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.ServicioMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServicioMaterialRepository extends JpaRepository<ServicioMaterial, Integer> {

    List<ServicioMaterial> findByDeletedAtIsNull();

    Optional<ServicioMaterial> findByServicioIdAndMaterialIdAndDeletedAtIsNull(Integer servicioId, Integer materialId);
}
