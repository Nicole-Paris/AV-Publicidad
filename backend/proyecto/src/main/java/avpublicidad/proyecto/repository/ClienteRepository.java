package avpublicidad.proyecto.repository;

import avpublicidad.proyecto.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {

    List<Cliente> findByDeletedAtIsNull();

    List<Cliente> findByTipoAndDeletedAtIsNull(String tipo);

    Optional<Cliente> findByRfc(String rfc);
}
