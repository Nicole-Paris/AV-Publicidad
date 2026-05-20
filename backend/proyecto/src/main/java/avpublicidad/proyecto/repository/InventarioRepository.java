package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventarioRepository extends JpaRepository<Inventario, Integer> {

    List<Inventario> findByDeletedAtIsNull();
}
