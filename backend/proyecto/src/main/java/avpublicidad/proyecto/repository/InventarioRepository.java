package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventarioRepository extends JpaRepository<Inventario, Integer> {

    List<Inventario> findByDeletedAtIsNull();

    Optional<Inventario> findByMaterialIdAndSucursalIdAndDeletedAtIsNull(Integer materialId, Integer sucursalId);
}
