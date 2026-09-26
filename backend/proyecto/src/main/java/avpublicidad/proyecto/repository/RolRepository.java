package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.Rol;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Integer> {

    List<Rol> findByDeletedAtIsNull();

    Optional<Rol> findByNombreIgnoreCaseAndDeletedAtIsNull(String nombre);
}
