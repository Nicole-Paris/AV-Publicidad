package avpublicidad.proyecto.service;

import avpublicidad.proyecto.dto.CorteCajaRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.CorteCaja;
import avpublicidad.proyecto.model.Pago;
import avpublicidad.proyecto.repository.CorteCajaRepository;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.PagoRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CorteCajaService {

    private static final int MAX_CAJAS_ABIERTAS_POR_EMPLEADO = 1;

    private final CorteCajaRepository corteCajaRepository;
    private final EmpleadoRepository empleadoRepository;
    private final PagoRepository pagoRepository;

    public List<CorteCaja> listar() {
        return corteCajaRepository.findByDeletedAtIsNull();
    }

    public CorteCaja obtenerPorId(Integer id) {
        return corteCajaRepository.findById(id)
                .filter(corteCaja -> corteCaja.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Corte de caja no encontrado"));
    }

    public CorteCaja crear(CorteCajaRequest request) {
        request.setFecha(LocalDate.now());
        request.setHoraInicio(LocalTime.now().withNano(0));
        validarEmpleado(request.getEmpleadoId());
        validarReglasNegocio(request, null);

        CorteCaja corteCaja = CorteCaja.builder()
                .fecha(request.getFecha())
                .horaInicio(request.getHoraInicio())
                .horaFin(request.getHoraFin())
                .saldoInicial(request.getSaldoInicial())
                .diferenciaSaldo(calcularDiferencia(request))
                .descripcion(request.getDescripcion())
                .saldoEsperado(request.getSaldoEsperado())
                .saldoReal(request.getSaldoReal())
                .empleadoId(request.getEmpleadoId())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        return corteCajaRepository.save(corteCaja);
    }

    public CorteCaja actualizar(Integer id, CorteCajaRequest request) {
        CorteCaja corteCaja = obtenerPorId(id);
        request.setFecha(corteCaja.getFecha());
        request.setHoraInicio(corteCaja.getHoraInicio());
        validarEmpleado(request.getEmpleadoId());
        validarReglasNegocio(request, id);

        corteCaja.setHoraFin(request.getHoraFin());
        corteCaja.setSaldoInicial(request.getSaldoInicial());
        corteCaja.setDiferenciaSaldo(calcularDiferencia(request));
        corteCaja.setDescripcion(request.getDescripcion());
        corteCaja.setSaldoEsperado(request.getSaldoEsperado());
        corteCaja.setSaldoReal(request.getSaldoReal());
        corteCaja.setEmpleadoId(request.getEmpleadoId());
        corteCaja.setCreatedBy(request.getCreatedBy());
        corteCaja.setUpdatedBy(request.getUpdatedBy());
        corteCaja.setDeletedBy(request.getDeletedBy());

        return corteCajaRepository.save(corteCaja);
    }

    public void eliminar(Integer id) {
        CorteCaja corteCaja = obtenerPorId(id);
        corteCaja.setDeletedAt(LocalDateTime.now());
        corteCajaRepository.save(corteCaja);
    }

    private void validarEmpleado(Integer empleadoId) {
        if (empleadoId != null && !empleadoRepository.existsById(empleadoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado");
        }
    }

    private void validarReglasNegocio(CorteCajaRequest request, Integer corteActualId) {
        if (request.getHoraFin() != null && request.getHoraInicio() != null
                && request.getHoraFin().isBefore(request.getHoraInicio())) {
            throw new ValidationException("La hora de fin no puede ser anterior a la hora de inicio");
        }

        if (request.getHoraFin() == null) {
            long cajasAbiertas = corteCajaRepository.countCajasAbiertasPorEmpleado(
                    request.getEmpleadoId(),
                    corteActualId
            );
            if (cajasAbiertas >= MAX_CAJAS_ABIERTAS_POR_EMPLEADO) {
                throw new ValidationException("Este empleado ya tiene una caja abierta. Cierra esa caja antes de abrir otra");
            }
        }

        if (request.getHoraFin() != null) {
            BigDecimal saldoEsperado = calcularSaldoEsperado(request);
            if (request.getSaldoEsperado() != null && request.getSaldoEsperado().compareTo(saldoEsperado) != 0) {
                throw new ValidationException("El saldo esperado debe coincidir con saldo inicial mas pagos del dia");
            }
        }
    }

    private BigDecimal calcularSaldoEsperado(CorteCajaRequest request) {
        BigDecimal totalPagos = pagoRepository.findByEmpleadoIdEmpleadoAndFechaAndDeletedAtIsNull(
                        request.getEmpleadoId(),
                        request.getFecha()
                ).stream()
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return request.getSaldoInicial().add(totalPagos);
    }

    private BigDecimal calcularDiferencia(CorteCajaRequest request) {
        if (request.getSaldoReal() == null || request.getSaldoEsperado() == null) {
            return request.getDiferenciaSaldo();
        }

        return request.getSaldoReal().subtract(request.getSaldoEsperado());
    }
}
