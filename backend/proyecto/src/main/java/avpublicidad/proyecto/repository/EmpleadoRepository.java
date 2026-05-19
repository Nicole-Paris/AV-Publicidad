package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmpleadoRepository extends JpaRepository<Empleado, Integer> {

    List<Empleado> findByDeletedAtIsNull();

    Optional<Empleado> findByCorreo(String correo);
}
