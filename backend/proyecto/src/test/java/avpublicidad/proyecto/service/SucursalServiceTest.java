package avpublicidad.proyecto.service;

import avpublicidad.proyecto.model.Sucursal;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import jakarta.validation.ValidationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SucursalServiceTest {

    @Mock
    private SucursalRepository sucursalRepository;

    @Mock
    private EmpleadoRepository empleadoRepository;

    @InjectMocks
    private SucursalService sucursalService;

    @Test
    void eliminar_debeRechazarSiLaSucursalTieneEmpleadosActivos() {
        Sucursal sucursal = Sucursal.builder()
                .idSucursal(1)
                .nombre("Sucursal Centro")
                .build();

        when(sucursalRepository.findById(1)).thenReturn(Optional.of(sucursal));
        when(empleadoRepository.countBySucursalIdSucursalAndDeletedAtIsNull(1)).thenReturn(2L);

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> sucursalService.eliminar(1, 7)
        );

        assertEquals("No se puede eliminar la sucursal porque tiene empleados activos", exception.getMessage());
        verify(sucursalRepository, never()).save(any(Sucursal.class));
    }
}
