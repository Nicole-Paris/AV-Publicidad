package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SucursalRepository extends JpaRepository<Sucursal, Integer> {

    List<Sucursal> findByDeletedAtIsNull();

    Optional<Sucursal> findByNombreIgnoreCaseAndDeletedAtIsNull(String nombre);
}
