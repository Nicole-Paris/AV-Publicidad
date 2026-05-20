package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.MaterialConstants;
import avpublicidad.proyecto.dto.MaterialRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Material;
import avpublicidad.proyecto.repository.CategoriaMaterialRepository;
import avpublicidad.proyecto.repository.MaterialRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final CategoriaMaterialRepository categoriaMaterialRepository;

    public List<Material> listar() {
        return materialRepository.findByDeletedAtIsNull();
    }

    public Material obtenerPorId(Integer id) {
        return materialRepository.findById(id)
                .filter(material -> material.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Material no encontrado"));
    }

    public Material crear(MaterialRequest request) {
        validarCategoria(request.getCategoriaMaterialId());

        Material material = Material.builder()
                .nombre(request.getNombre())
                .unidad(normalizarUnidad(request.getUnidad()))
                .estado(normalizarEstado(request.getEstado()))
                .costoUnitario(request.getCostoUnitario())
                .categoriaMaterialId(request.getCategoriaMaterialId())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return materialRepository.save(material);
    }

    public Material actualizar(Integer id, MaterialRequest request) {
        Material material = obtenerPorId(id);
        validarCategoria(request.getCategoriaMaterialId());

        material.setNombre(request.getNombre());
        material.setUnidad(normalizarUnidad(request.getUnidad()));
        material.setEstado(normalizarEstado(request.getEstado()));
        material.setCostoUnitario(request.getCostoUnitario());
        material.setCategoriaMaterialId(request.getCategoriaMaterialId());
        material.setCreatedBy(request.getCreatedBy());
        material.setUpdatedBy(request.getUpdatedBy());
        material.setDeletedBy(request.getDeletedBy());

        return materialRepository.save(material);
    }

    public void eliminar(Integer id) {
        Material material = obtenerPorId(id);
        material.setDeletedAt(LocalDateTime.now());
        materialRepository.save(material);
    }

    private void validarCategoria(Integer categoriaMaterialId) {
        if (categoriaMaterialId != null && !categoriaMaterialRepository.existsById(categoriaMaterialId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria de material no encontrada");
        }
    }

    private String normalizarUnidad(String unidad) {
        if (unidad == null) {
            throw new ValidationException("La unidad es obligatoria");
        }

        String valor = unidad.trim();
        if (MaterialConstants.UNIDAD_PIEZAS.equalsIgnoreCase(valor)) {
            return MaterialConstants.UNIDAD_PIEZAS;
        }
        if (MaterialConstants.UNIDAD_METROS.equalsIgnoreCase(valor)) {
            return MaterialConstants.UNIDAD_METROS;
        }
        if (MaterialConstants.UNIDAD_LITROS.equalsIgnoreCase(valor)) {
            return MaterialConstants.UNIDAD_LITROS;
        }

        throw new ValidationException("La unidad debe ser Piezas, Metros o Litros");
    }

    private String normalizarEstado(String estado) {
        if (estado == null) {
            throw new ValidationException("El estado es obligatorio");
        }

        String valor = estado.trim();
        if (MaterialConstants.ESTADO_DISPONIBLE.equalsIgnoreCase(valor)) {
            return MaterialConstants.ESTADO_DISPONIBLE;
        }
        if (MaterialConstants.ESTADO_NO_DISPONIBLE.equalsIgnoreCase(valor)) {
            return MaterialConstants.ESTADO_NO_DISPONIBLE;
        }

        throw new ValidationException("El estado debe ser Disponible o No disponible");
    }
}
