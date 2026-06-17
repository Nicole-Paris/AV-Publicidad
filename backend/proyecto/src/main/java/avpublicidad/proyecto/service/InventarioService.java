package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.MaterialConstants;
import avpublicidad.proyecto.dto.InventarioRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Inventario;
import avpublicidad.proyecto.model.Material;
import avpublicidad.proyecto.repository.InventarioRepository;
import avpublicidad.proyecto.repository.MaterialRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventarioService {

    private final InventarioRepository inventarioRepository;
    private final MaterialRepository materialRepository;
    private final SucursalRepository sucursalRepository;

    public List<Inventario> listar() {
        return inventarioRepository.findByDeletedAtIsNull();
    }

    public Inventario obtenerPorId(Integer id) {
        return inventarioRepository.findById(id)
                .filter(inventario -> inventario.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado"));
    }

    public Inventario crear(InventarioRequest request) {
        validarRelaciones(request);
        validarMaterialDisponible(request.getMaterialId());
        validarInventarioUnico(request, null);

        Inventario inventario = Inventario.builder()
                .stockActual(request.getStockActual())
                .stockMinimo(request.getStockMinimo())
                .materialId(request.getMaterialId())
                .sucursalId(request.getSucursalId())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return inventarioRepository.save(inventario);
    }

    public Inventario actualizar(Integer id, InventarioRequest request) {
        Inventario inventario = obtenerPorId(id);
        validarRelaciones(request);
        validarMaterialDisponible(request.getMaterialId());
        validarInventarioUnico(request, id);

        inventario.setStockActual(request.getStockActual());
        inventario.setStockMinimo(request.getStockMinimo());
        inventario.setMaterialId(request.getMaterialId());
        inventario.setSucursalId(request.getSucursalId());
        inventario.setCreatedBy(request.getCreatedBy());
        inventario.setUpdatedBy(request.getUpdatedBy());
        inventario.setDeletedBy(request.getDeletedBy());

        return inventarioRepository.save(inventario);
    }

    public void eliminar(Integer id) {
        Inventario inventario = obtenerPorId(id);
        inventario.setDeletedAt(LocalDateTime.now());
        inventarioRepository.save(inventario);
    }

    private void validarRelaciones(InventarioRequest request) {
        if (request.getMaterialId() != null && !materialRepository.existsById(request.getMaterialId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Material no encontrado");
        }

        if (request.getSucursalId() != null && !sucursalRepository.existsById(request.getSucursalId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada");
        }
    }

    private void validarMaterialDisponible(Integer materialId) {
        if (materialId == null) {
            return;
        }

        Material material = materialRepository.findById(materialId)
                .filter(materialEncontrado -> materialEncontrado.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material no encontrado"));

        if (!MaterialConstants.ESTADO_DISPONIBLE.equals(material.getEstado())) {
            throw new ValidationException("No se puede crear inventario con un material no disponible");
        }
    }

    private void validarInventarioUnico(InventarioRequest request, Integer inventarioActualId) {
        if (request.getMaterialId() == null || request.getSucursalId() == null) {
            return;
        }

        inventarioRepository.findByMaterialIdAndSucursalIdAndDeletedAtIsNull(request.getMaterialId(), request.getSucursalId())
                .filter(inventario -> !inventario.getIdInventario().equals(inventarioActualId))
                .ifPresent(inventario -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe inventario para ese material en esa sucursal");
                });
    }
}
