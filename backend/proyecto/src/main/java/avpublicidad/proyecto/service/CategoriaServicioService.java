package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.EstadoConstants;
import avpublicidad.proyecto.dto.CategoriaServicioRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.CategoriaServicio;
import avpublicidad.proyecto.repository.CategoriaServicioRepository;
import avpublicidad.proyecto.repository.ServicioRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaServicioService {

    private final CategoriaServicioRepository categoriaServicioRepository;
    private final ServicioRepository servicioRepository;

    public List<CategoriaServicio> listar() {
        return categoriaServicioRepository.findByDeletedAtIsNull();
    }

    public CategoriaServicio obtenerPorId(Integer id) {
        return categoriaServicioRepository.findById(id)
                .filter(categoria -> categoria.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria de servicio no encontrada"));
    }

    public CategoriaServicio crear(CategoriaServicioRequest request) {
        validarNombreUnico(request.getNombre(), null);

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
        validarNombreUnico(request.getNombre(), id);
        String estadoNormalizado = normalizarEstado(request.getEstado());

        if (EstadoConstants.INACTIVO.equals(estadoNormalizado)
                && !EstadoConstants.INACTIVO.equals(categoria.getEstado())
                && servicioRepository.existsByCategoriaServicioIdAndDeletedAtIsNull(id)) {
            throw new ValidationException("No se puede inactivar la categoria porque tiene servicios ligados");
        }

        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        categoria.setEstado(estadoNormalizado);
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

    private void validarNombreUnico(String nombre, Integer categoriaActualId) {
        if (nombre == null || nombre.isBlank()) {
            return;
        }

        categoriaServicioRepository.findByNombreIgnoreCaseAndDeletedAtIsNull(nombre.trim())
                .filter(categoria -> !categoria.getIdCategoriaServicio().equals(categoriaActualId))
                .ifPresent(categoria -> {
                    throw new ValidationException("Ya existe una categoria de servicio activa con ese nombre");
                });
    }
}
