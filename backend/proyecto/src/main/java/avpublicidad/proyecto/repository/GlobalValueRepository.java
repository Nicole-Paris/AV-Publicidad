package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.GlobalValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GlobalValueRepository extends JpaRepository<GlobalValue, Integer> {

    List<GlobalValue> findByDeletedAtIsNull();

    List<GlobalValue> findByTipoAndDeletedAtIsNull(String tipo);

    Optional<GlobalValue> findByTipoAndNombreAndDeletedAtIsNull(String tipo, String nombre);
}
