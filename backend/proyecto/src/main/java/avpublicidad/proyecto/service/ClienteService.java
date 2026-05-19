package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.ClienteConstants;
import avpublicidad.proyecto.dto.ClienteRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Cliente;
import avpublicidad.proyecto.repository.ClienteRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public List<Cliente> listar() {
        return clienteRepository.findByDeletedAtIsNull();
    }

    public List<Cliente> listarFrecuentes() {
        return clienteRepository.findByTipoAndDeletedAtIsNull(ClienteConstants.TIPO_FRECUENTE);
    }

    public Cliente obtenerPorId(Integer id) {
        return clienteRepository.findById(id)
                .filter(cliente -> cliente.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
    }

    public Cliente crear(ClienteRequest request) {
        validarRfcDisponible(request.getRfc(), null);

        Cliente cliente = Cliente.builder()
                .nombre(request.getNombre())
                .apellidoPaterno(request.getApellidoPaterno())
                .apellidoMaterno(request.getApellidoMaterno())
                .telefono(request.getTelefono())
                .tipo(normalizarTipo(request.getTipo()))
                .tieneCredito(request.getTieneCredito() != null ? request.getTieneCredito() : false)
                .creditoActual(request.getCreditoActual() != null ? request.getCreditoActual() : BigDecimal.ZERO)
                .limiteCredito(request.getLimiteCredito())
                .direccion(request.getDireccion())
                .rfc(request.getRfc())
                .codigoPostal(request.getCodigoPostal())
                .razonSocial(request.getRazonSocial())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return clienteRepository.save(cliente);
    }

    public Cliente actualizar(Integer id, ClienteRequest request) {
        Cliente cliente = obtenerPorId(id);
        validarRfcDisponible(request.getRfc(), id);

        cliente.setNombre(request.getNombre());
        cliente.setApellidoPaterno(request.getApellidoPaterno());
        cliente.setApellidoMaterno(request.getApellidoMaterno());
        cliente.setTelefono(request.getTelefono());
        cliente.setTipo(normalizarTipo(request.getTipo()));
        cliente.setTieneCredito(request.getTieneCredito() != null ? request.getTieneCredito() : false);
        cliente.setCreditoActual(request.getCreditoActual() != null ? request.getCreditoActual() : BigDecimal.ZERO);
        cliente.setLimiteCredito(request.getLimiteCredito());
        cliente.setDireccion(request.getDireccion());
        cliente.setRfc(request.getRfc());
        cliente.setCodigoPostal(request.getCodigoPostal());
        cliente.setRazonSocial(request.getRazonSocial());
        cliente.setCreatedBy(request.getCreatedBy());
        cliente.setUpdatedBy(request.getUpdatedBy());
        cliente.setDeletedBy(request.getDeletedBy());

        return clienteRepository.save(cliente);
    }

    public void eliminar(Integer id) {
        Cliente cliente = obtenerPorId(id);
        cliente.setDeletedAt(LocalDateTime.now());
        clienteRepository.save(cliente);
    }

    private String normalizarTipo(String tipo) {
        if (tipo == null) {
            throw new ValidationException("El tipo de cliente es obligatorio");
        }

        String valor = tipo.trim();
        if (ClienteConstants.TIPO_FRECUENTE.equalsIgnoreCase(valor)) {
            return ClienteConstants.TIPO_FRECUENTE;
        }

        if (ClienteConstants.TIPO_NO_FRECUENTE.equalsIgnoreCase(valor) || "NoFrecuente".equalsIgnoreCase(valor)) {
            return ClienteConstants.TIPO_NO_FRECUENTE;
        }

        throw new ValidationException("El tipo de cliente debe ser Frecuente o No frecuente");
    }

    private void validarRfcDisponible(String rfc, Integer idClienteActual) {
        if (rfc == null || rfc.isBlank()) {
            return;
        }

        clienteRepository.findByRfc(rfc.trim())
                .filter(cliente -> !cliente.getIdCliente().equals(idClienteActual))
                .ifPresent(cliente -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un cliente con ese RFC");
                });
    }
}
