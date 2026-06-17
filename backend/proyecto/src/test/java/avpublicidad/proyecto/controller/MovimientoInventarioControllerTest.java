package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.constants.MovimientoInventarioConstants;
import avpublicidad.proyecto.model.MovimientoInventario;
import avpublicidad.proyecto.service.MovimientoInventarioService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MovimientoInventarioController.class)
@Import(SecurityConfig.class)
class MovimientoInventarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private MovimientoInventarioService movimientoInventarioService;

    @Test
    void listar_debeRetornarMovimientos() throws Exception {
        when(movimientoInventarioService.listar()).thenReturn(List.of(movimiento(1), movimiento(2)));

        mockMvc.perform(get("/movimientos-inventario"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idMovimientoInventario").value(1))
                .andExpect(jsonPath("$[0].tipo").value(MovimientoInventarioConstants.TIPO_ENTRADA));
    }

    @Test
    void obtenerPorId_debeRetornarMovimiento() throws Exception {
        when(movimientoInventarioService.obtenerPorId(1)).thenReturn(movimiento(1));

        mockMvc.perform(get("/movimientos-inventario/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idMovimientoInventario").value(1))
                .andExpect(jsonPath("$.inventarioId").value(1));
    }

    @Test
    void crear_conValoresValidos_debeRetornarMovimientoCreado() throws Exception {
        when(movimientoInventarioService.crear(any())).thenReturn(movimiento(1));

        mockMvc.perform(post("/movimientos-inventario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idMovimientoInventario").value(1))
                .andExpect(jsonPath("$.cantidad").value(10.00));

        verify(movimientoInventarioService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(movimientoInventarioService.crear(any())).thenReturn(movimientoConValoresLimite());

        mockMvc.perform(post("/movimientos-inventario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cantidad").value(99999999.99))
                .andExpect(jsonPath("$.motivo").value(texto(50)));
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarMovimientoActualizado() throws Exception {
        when(movimientoInventarioService.actualizar(eq(1), any())).thenReturn(movimiento(1));

        mockMvc.perform(put("/movimientos-inventario/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idMovimientoInventario").value(1));

        verify(movimientoInventarioService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(movimientoInventarioService).eliminar(1);

        mockMvc.perform(delete("/movimientos-inventario/1"))
                .andExpect(status().isOk());

        verify(movimientoInventarioService).eliminar(1);
    }

    @Test
    void crear_sinCantidad_debeResponderBadRequest() throws Exception {
        MovimientoInventarioJson request = requestValido();
        request.cantidad = null;

        mockMvc.perform(post("/movimientos-inventario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCantidadNegativa_debeResponderBadRequest() throws Exception {
        MovimientoInventarioJson request = requestValido();
        request.cantidad = new BigDecimal("-0.01");

        mockMvc.perform(post("/movimientos-inventario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinFecha_debeResponderBadRequest() throws Exception {
        MovimientoInventarioJson request = requestValido();
        request.fecha = null;

        mockMvc.perform(post("/movimientos-inventario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinTipoYMotivo_debeResponderBadRequest() throws Exception {
        MovimientoInventarioJson request = requestValido();
        request.tipo = "";
        request.motivo = "";

        mockMvc.perform(post("/movimientos-inventario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinInventario_debeResponderBadRequest() throws Exception {
        MovimientoInventarioJson request = requestValido();
        request.inventarioId = null;

        mockMvc.perform(post("/movimientos-inventario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        MovimientoInventarioJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/movimientos-inventario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        MovimientoInventarioJson request = requestConValoresLimite();
        request.cantidad = new BigDecimal("100000000.00");
        request.motivo = texto(51);

        mockMvc.perform(post("/movimientos-inventario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(movimientoInventarioService);
    }

    private MovimientoInventario movimiento(Integer id) {
        return MovimientoInventario.builder()
                .idMovimientoInventario(id)
                .cantidad(new BigDecimal("10.00"))
                .fecha(LocalDateTime.of(2026, 5, 20, 10, 0))
                .tipo(MovimientoInventarioConstants.TIPO_ENTRADA)
                .motivo("Compra de material")
                .inventarioId(1)
                .createdBy(1)
                .build();
    }

    private MovimientoInventario movimientoConValoresLimite() {
        return MovimientoInventario.builder()
                .idMovimientoInventario(1)
                .cantidad(new BigDecimal("99999999.99"))
                .fecha(LocalDateTime.of(2026, 5, 20, 10, 0))
                .tipo(MovimientoInventarioConstants.TIPO_SALIDA)
                .motivo(texto(50))
                .inventarioId(1)
                .createdBy(1)
                .build();
    }

    private MovimientoInventarioJson requestValido() {
        MovimientoInventarioJson request = new MovimientoInventarioJson();
        request.cantidad = new BigDecimal("10.00");
        request.fecha = "2026-05-20T10:00:00";
        request.tipo = MovimientoInventarioConstants.TIPO_ENTRADA;
        request.motivo = "Compra de material";
        request.inventarioId = 1;
        request.createdBy = 1;
        return request;
    }

    private MovimientoInventarioJson requestConValoresLimite() {
        MovimientoInventarioJson request = requestValido();
        request.cantidad = new BigDecimal("99999999.99");
        request.tipo = MovimientoInventarioConstants.TIPO_SALIDA;
        request.motivo = texto(50);
        return request;
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class MovimientoInventarioJson {
        public BigDecimal cantidad;
        public String fecha;
        public String tipo;
        public String motivo;
        public Integer inventarioId;
        public Integer createdBy;
    }
}
