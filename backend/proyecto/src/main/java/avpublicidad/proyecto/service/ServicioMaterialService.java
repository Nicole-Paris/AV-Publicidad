package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.MaterialConstants;
import avpublicidad.proyecto.dto.ServicioMaterialRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Material;
import avpublicidad.proyecto.model.ServicioMaterial;
import avpublicidad.proyecto.repository.MaterialRepository;
import avpublicidad.proyecto.repository.ServicioMaterialRepository;
import avpublicidad.proyecto.repository.ServicioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServicioMaterialService {

    private final ServicioMaterialRepository servicioMaterialRepository;
    private final ServicioRepository servicioRepository;
    private final MaterialRepository materialRepository;

    public List<ServicioMaterial> listar() {
        return servicioMaterialRepository.findByDeletedAtIsNull();
    }

    public ServicioMaterial obtenerPorId(Integer id) {
        return servicioMaterialRepository.findById(id)
                .filter(servicioMaterial -> servicioMaterial.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio material no encontrado"));
    }

    public ServicioMaterial crear(ServicioMaterialRequest request) {
        validarRelaciones(request);
        validarDuplicado(request, null);

        ServicioMaterial servicioMaterial = ServicioMaterial.builder()
                .cantidadUsada(request.getCantidadUsada())
                .servicioId(request.getServicioId())
                .materialId(request.getMaterialId())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return servicioMaterialRepository.save(servicioMaterial);
    }

    public ServicioMaterial actualizar(Integer id, ServicioMaterialRequest request) {
        ServicioMaterial servicioMaterial = obtenerPorId(id);
        validarRelaciones(request);
        validarDuplicado(request, id);

        servicioMaterial.setCantidadUsada(request.getCantidadUsada());
        servicioMaterial.setServicioId(request.getServicioId());
        servicioMaterial.setMaterialId(request.getMaterialId());
        servicioMaterial.setCreatedBy(request.getCreatedBy());
        servicioMaterial.setUpdatedBy(request.getUpdatedBy());
        servicioMaterial.setDeletedBy(request.getDeletedBy());

        return servicioMaterialRepository.save(servicioMaterial);
    }

    public void eliminar(Integer id) {
        ServicioMaterial servicioMaterial = obtenerPorId(id);
        servicioMaterial.setDeletedAt(LocalDateTime.now());
        servicioMaterialRepository.save(servicioMaterial);
    }

    private void validarRelaciones(ServicioMaterialRequest request) {
        if (request.getServicioId() != null && !servicioRepository.existsById(request.getServicioId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Servicio no encontrado");
        }

        if (request.getMaterialId() != null) {
            Material material = materialRepository.findById(request.getMaterialId())
                    .filter(valor -> valor.getDeletedAt() == null)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material no encontrado"));

            if (!MaterialConstants.ESTADO_DISPONIBLE.equals(material.getEstado())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede asignar un material inactivo a un servicio");
            }
        }
    }

    private void validarDuplicado(ServicioMaterialRequest request, Integer idActual) {
        servicioMaterialRepository.findByServicioIdAndMaterialIdAndDeletedAtIsNull(
                        request.getServicioId(),
                        request.getMaterialId()
                )
                .filter(servicioMaterial -> idActual == null || !servicioMaterial.getIdServicioMaterial().equals(idActual))
                .ifPresent(servicioMaterial -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "El material ya esta asignado al servicio");
                });
    }
}
