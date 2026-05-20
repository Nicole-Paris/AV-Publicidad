package avpublicidad.proyecto.service;

import avpublicidad.proyecto.dto.InventarioRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Inventario;
import avpublicidad.proyecto.repository.InventarioRepository;
import avpublicidad.proyecto.repository.MaterialRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
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
}
