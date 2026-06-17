package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.EstadoConstants;
import avpublicidad.proyecto.dto.CategoriaMaterialRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.CategoriaMaterial;
import avpublicidad.proyecto.repository.CategoriaMaterialRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaMaterialService {

    private final CategoriaMaterialRepository categoriaMaterialRepository;

    public List<CategoriaMaterial> listar() {
        return categoriaMaterialRepository.findByDeletedAtIsNull();
    }

    public CategoriaMaterial obtenerPorId(Integer id) {
        return categoriaMaterialRepository.findById(id)
                .filter(categoria -> categoria.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria de material no encontrada"));
    }

    public CategoriaMaterial crear(CategoriaMaterialRequest request) {
        CategoriaMaterial categoria = CategoriaMaterial.builder()
                .nombre(request.getNombre())
                .estado(normalizarEstado(request.getEstado()))
                .descripcion(request.getDescripcion())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return categoriaMaterialRepository.save(categoria);
    }

    public CategoriaMaterial actualizar(Integer id, CategoriaMaterialRequest request) {
        CategoriaMaterial categoria = obtenerPorId(id);

        categoria.setNombre(request.getNombre());
        categoria.setEstado(normalizarEstado(request.getEstado()));
        categoria.setDescripcion(request.getDescripcion());
        categoria.setCreatedBy(request.getCreatedBy());
        categoria.setUpdatedBy(request.getUpdatedBy());
        categoria.setDeletedBy(request.getDeletedBy());

        return categoriaMaterialRepository.save(categoria);
    }

    public void eliminar(Integer id) {
        CategoriaMaterial categoria = obtenerPorId(id);
        categoria.setDeletedAt(LocalDateTime.now());
        categoriaMaterialRepository.save(categoria);
    }

    private String normalizarEstado(String estado) {
        if (estado == null) {
            throw new ValidationException("El estado es obligatorio");
        }

        String valor = estado.trim();
        if (EstadoConstants.ACTIVO.equalsIgnoreCase(valor)) {
            return EstadoConstants.ACTIVO;
        }
        if (EstadoConstants.INACTIVO.equalsIgnoreCase(valor)) {
            return EstadoConstants.INACTIVO;
        }

        throw new ValidationException("El estado debe ser Activo o Inactivo");
    }
}
