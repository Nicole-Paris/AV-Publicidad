package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.CorteCaja;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface CorteCajaRepository extends JpaRepository<CorteCaja, Integer> {

    List<CorteCaja> findByDeletedAtIsNull();

    List<CorteCaja> findByEmpleadoIdAndFechaAndHoraFinIsNotNullAndDeletedAtIsNull(Integer empleadoId, LocalDate fecha);
}
