package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.EstadoConstants;
import avpublicidad.proyecto.dto.ServicioRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Servicio;
import avpublicidad.proyecto.repository.CategoriaServicioRepository;
import avpublicidad.proyecto.repository.ServicioRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServicioService {

    private final ServicioRepository servicioRepository;
    private final CategoriaServicioRepository categoriaServicioRepository;

    public List<Servicio> listar() {
        return servicioRepository.findByDeletedAtIsNull();
    }

    public Servicio obtenerPorId(Integer id) {
        return servicioRepository.findById(id)
                .filter(servicio -> servicio.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado"));
    }

    public Servicio crear(ServicioRequest request) {
        validarCategoria(request.getCategoriaServicioId());

        Servicio servicio = Servicio.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .estado(normalizarEstado(request.getEstado()))
                .categoriaServicioId(request.getCategoriaServicioId())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return servicioRepository.save(servicio);
    }

    public Servicio actualizar(Integer id, ServicioRequest request) {
        Servicio servicio = obtenerPorId(id);
        validarCategoria(request.getCategoriaServicioId());

        servicio.setNombre(request.getNombre());
        servicio.setDescripcion(request.getDescripcion());
        servicio.setEstado(normalizarEstado(request.getEstado()));
        servicio.setCategoriaServicioId(request.getCategoriaServicioId());
        servicio.setCreatedBy(request.getCreatedBy());
        servicio.setUpdatedBy(request.getUpdatedBy());
        servicio.setDeletedBy(request.getDeletedBy());

        return servicioRepository.save(servicio);
    }

    public void eliminar(Integer id) {
        Servicio servicio = obtenerPorId(id);
        servicio.setDeletedAt(LocalDateTime.now());
        servicioRepository.save(servicio);
    }

    private void validarCategoria(Integer categoriaServicioId) {
        if (categoriaServicioId != null && !categoriaServicioRepository.existsById(categoriaServicioId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria de servicio no encontrada");
        }
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
