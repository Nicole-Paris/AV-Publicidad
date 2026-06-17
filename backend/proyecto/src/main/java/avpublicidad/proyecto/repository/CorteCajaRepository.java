package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.CorteCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface CorteCajaRepository extends JpaRepository<CorteCaja, Integer> {

    List<CorteCaja> findByDeletedAtIsNull();

    List<CorteCaja> findByEmpleadoIdAndFechaAndHoraFinIsNotNullAndDeletedAtIsNull(Integer empleadoId, LocalDate fecha);

    boolean existsByEmpleadoIdAndHoraFinIsNullAndDeletedAtIsNull(Integer empleadoId);

    @Query("""
            select count(corte)
            from CorteCaja corte
            where corte.empleadoId = :empleadoId
              and corte.horaFin is null
              and corte.deletedAt is null
              and (:corteActualId is null or corte.idCorteCaja <> :corteActualId)
            """)
    long countCajasAbiertasPorEmpleado(
            @Param("empleadoId") Integer empleadoId,
            @Param("corteActualId") Integer corteActualId
    );
}
