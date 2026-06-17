package avpublicidad.proyecto.service;

import avpublicidad.proyecto.dto.GlobalValueRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.GlobalValue;
import avpublicidad.proyecto.repository.GlobalValueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GlobalValueService {

    private final GlobalValueRepository globalValueRepository;

    public List<GlobalValue> listar() {
        return globalValueRepository.findByDeletedAtIsNull();
    }

    public List<GlobalValue> listarPorTipo(String tipo) {
        return globalValueRepository.findByTipoAndDeletedAtIsNull(tipo);
    }

    public GlobalValue obtenerPorId(Integer id) {
        return globalValueRepository.findById(id)
                .filter(globalValue -> globalValue.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Valor global no encontrado"));
    }

    public GlobalValue obtenerPorTipoYNombre(String tipo, String nombre) {
        return globalValueRepository.findByTipoAndNombreAndDeletedAtIsNull(tipo, nombre)
                .orElseThrow(() -> new ResourceNotFoundException("Valor global no encontrado"));
    }

    public GlobalValue crear(GlobalValueRequest request) {
        GlobalValue globalValue = GlobalValue.builder()
                .tipo(request.getTipo())
                .nombre(request.getNombre())
                .valor(request.getValor())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return globalValueRepository.save(globalValue);
    }

    public GlobalValue actualizar(Integer id, GlobalValueRequest request) {
        GlobalValue globalValue = obtenerPorId(id);

        globalValue.setTipo(request.getTipo());
        globalValue.setNombre(request.getNombre());
        globalValue.setValor(request.getValor());
        globalValue.setCreatedBy(request.getCreatedBy());
        globalValue.setUpdatedBy(request.getUpdatedBy());
        globalValue.setDeletedBy(request.getDeletedBy());

        return globalValueRepository.save(globalValue);
    }

    public void eliminar(Integer id) {
        GlobalValue globalValue = obtenerPorId(id);
        globalValue.setDeletedAt(LocalDateTime.now());
        globalValueRepository.save(globalValue);
    }
}
