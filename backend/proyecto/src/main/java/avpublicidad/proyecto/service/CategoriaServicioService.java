package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.EstadoConstants;
import avpublicidad.proyecto.dto.CategoriaServicioRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.CategoriaServicio;
import avpublicidad.proyecto.repository.CategoriaServicioRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaServicioService {

    private final CategoriaServicioRepository categoriaServicioRepository;

    public List<CategoriaServicio> listar() {
        return categoriaServicioRepository.findByDeletedAtIsNull();
    }

    public CategoriaServicio obtenerPorId(Integer id) {
        return categoriaServicioRepository.findById(id)
                .filter(categoria -> categoria.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria de servicio no encontrada"));
    }

    public CategoriaServicio crear(CategoriaServicioRequest request) {
        CategoriaServicio categoria = CategoriaServicio.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .estado(normalizarEstado(request.getEstado()))
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return categoriaServicioRepository.save(categoria);
    }

    public CategoriaServicio actualizar(Integer id, CategoriaServicioRequest request) {
        CategoriaServicio categoria = obtenerPorId(id);

        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        categoria.setEstado(normalizarEstado(request.getEstado()));
        categoria.setCreatedBy(request.getCreatedBy());
        categoria.setUpdatedBy(request.getUpdatedBy());
        categoria.setDeletedBy(request.getDeletedBy());

        return categoriaServicioRepository.save(categoria);
    }

    public void eliminar(Integer id) {
        CategoriaServicio categoria = obtenerPorId(id);
        categoria.setDeletedAt(LocalDateTime.now());
        categoriaServicioRepository.save(categoria);
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
