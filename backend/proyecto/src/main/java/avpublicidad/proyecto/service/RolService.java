package avpublicidad.proyecto.service;

import avpublicidad.proyecto.dto.RolRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Rol;
import avpublicidad.proyecto.repository.RolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RolService {

    private final RolRepository rolRepository;

    public List<Rol> listar() {
        return rolRepository.findByDeletedAtIsNull();
    }

    public Rol obtenerPorId(Integer id) {
        return rolRepository.findById(id)
                .filter(rol -> rol.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Rol no encontrado"));
    }

    public Rol crear(RolRequest request) {
        Rol rol = Rol.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return rolRepository.save(rol);
    }

    public Rol actualizar(Integer id, RolRequest request) {
        Rol rol = obtenerPorId(id);

        rol.setNombre(request.getNombre());
        rol.setDescripcion(request.getDescripcion());
        rol.setCreatedBy(request.getCreatedBy());
        rol.setUpdatedBy(request.getUpdatedBy());
        rol.setDeletedBy(request.getDeletedBy());

        return rolRepository.save(rol);
    }

    public void eliminar(Integer id) {
        Rol rol = obtenerPorId(id);
        rol.setDeletedAt(LocalDateTime.now());
        rolRepository.save(rol);
    }
}
