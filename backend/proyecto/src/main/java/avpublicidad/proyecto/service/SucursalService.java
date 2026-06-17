package avpublicidad.proyecto.service;

import avpublicidad.proyecto.dto.SucursalRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Sucursal;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SucursalService {

    private final SucursalRepository sucursalRepository;
    private final EmpleadoRepository empleadoRepository;

    public List<Sucursal> listar() {
        return sucursalRepository.findByDeletedAtIsNull();
    }

    public Sucursal obtenerPorId(Integer id) {
        return sucursalRepository.findById(id)
                .filter(sucursal -> sucursal.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Sucursal no encontrada"));
    }

    public Sucursal crear(SucursalRequest request) {
        validarNombreUnico(request.getNombre(), null);

        Sucursal sucursal = Sucursal.builder()
                .nombre(request.getNombre())
                .direccion(request.getDireccion())
                .codigoPostal(request.getCodigoPostal())
                .telefono(request.getTelefono())
                .horario(request.getHorario())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return sucursalRepository.save(sucursal);
    }

    public Sucursal actualizar(Integer id, SucursalRequest request) {
        Sucursal sucursal = obtenerPorId(id);
        validarNombreUnico(request.getNombre(), id);

        sucursal.setNombre(request.getNombre());
        sucursal.setDireccion(request.getDireccion());
        sucursal.setCodigoPostal(request.getCodigoPostal());
        sucursal.setTelefono(request.getTelefono());
        sucursal.setHorario(request.getHorario());
        sucursal.setCreatedBy(request.getCreatedBy());
        sucursal.setUpdatedBy(request.getUpdatedBy());
        sucursal.setDeletedBy(request.getDeletedBy());

        return sucursalRepository.save(sucursal);
    }

    public void eliminar(Integer id, Integer deletedBy) {
        Sucursal sucursal = obtenerPorId(id);
        long empleadosActivos = empleadoRepository.countBySucursalIdSucursalAndDeletedAtIsNull(id);
        if (empleadosActivos > 0) {
            throw new ValidationException("No se puede eliminar la sucursal porque tiene empleados activos");
        }

        sucursal.setDeletedAt(LocalDateTime.now());
        sucursal.setDeletedBy(deletedBy);
        sucursalRepository.save(sucursal);
    }

    public void eliminar(Integer id) {
        eliminar(id, null);
    }

    private void validarNombreUnico(String nombre, Integer sucursalActualId) {
        if (nombre == null || nombre.isBlank()) {
            return;
        }

        sucursalRepository.findByNombreIgnoreCaseAndDeletedAtIsNull(nombre.trim())
                .filter(sucursal -> !sucursal.getIdSucursal().equals(sucursalActualId))
                .ifPresent(sucursal -> {
                    throw new ValidationException("Ya existe una sucursal activa con ese nombre");
                });
    }
}
