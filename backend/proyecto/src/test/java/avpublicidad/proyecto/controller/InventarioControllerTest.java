package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.model.Inventario;
import avpublicidad.proyecto.service.InventarioService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
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

@WebMvcTest(InventarioController.class)
@Import(SecurityConfig.class)
class InventarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private InventarioService inventarioService;

    @Test
    void listar_debeRetornarInventarios() throws Exception {
        when(inventarioService.listar()).thenReturn(List.of(inventario(1), inventario(2)));

        mockMvc.perform(get("/inventarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idInventario").value(1))
                .andExpect(jsonPath("$[0].materialId").value(1));
    }

    @Test
    void obtenerPorId_debeRetornarInventario() throws Exception {
        when(inventarioService.obtenerPorId(1)).thenReturn(inventario(1));

        mockMvc.perform(get("/inventarios/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idInventario").value(1))
                .andExpect(jsonPath("$.sucursalId").value(1));
    }

    @Test
    void crear_conValoresValidos_debeRetornarInventarioCreado() throws Exception {
        when(inventarioService.crear(any())).thenReturn(inventario(1));

        mockMvc.perform(post("/inventarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idInventario").value(1))
                .andExpect(jsonPath("$.stockActual").value(25.00));

        verify(inventarioService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(inventarioService.crear(any())).thenReturn(inventarioConValoresLimite());

        mockMvc.perform(post("/inventarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockActual").value(99999999.99))
                .andExpect(jsonPath("$.stockMinimo").value(99999999.99));
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarInventarioActualizado() throws Exception {
        when(inventarioService.actualizar(eq(1), any())).thenReturn(inventario(1));

        mockMvc.perform(put("/inventarios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idInventario").value(1));

        verify(inventarioService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(inventarioService).eliminar(1);

        mockMvc.perform(delete("/inventarios/1"))
                .andExpect(status().isOk());

        verify(inventarioService).eliminar(1);
    }

    @Test
    void crear_sinStocks_debeResponderBadRequest() throws Exception {
        InventarioJson request = requestValido();
        request.stockActual = null;
        request.stockMinimo = null;

        mockMvc.perform(post("/inventarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conStockNegativo_debeResponderBadRequest() throws Exception {
        InventarioJson request = requestValido();
        request.stockActual = new BigDecimal("-0.01");

        mockMvc.perform(post("/inventarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinRelaciones_debeResponderBadRequest() throws Exception {
        InventarioJson request = requestValido();
        request.materialId = null;
        request.sucursalId = null;

        mockMvc.perform(post("/inventarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        InventarioJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/inventarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        InventarioJson request = requestConValoresLimite();
        request.stockActual = new BigDecimal("100000000.00");
        request.stockMinimo = new BigDecimal("100000000.00");

        mockMvc.perform(post("/inventarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(inventarioService);
    }

    private Inventario inventario(Integer id) {
        return Inventario.builder()
                .idInventario(id)
                .stockActual(new BigDecimal("25.00"))
                .stockMinimo(new BigDecimal("5.00"))
                .materialId(1)
                .sucursalId(1)
                .createdBy(1)
                .build();
    }

    private Inventario inventarioConValoresLimite() {
        return Inventario.builder()
                .idInventario(1)
                .stockActual(new BigDecimal("99999999.99"))
                .stockMinimo(new BigDecimal("99999999.99"))
                .materialId(1)
                .sucursalId(1)
                .createdBy(1)
                .build();
    }

    private InventarioJson requestValido() {
        InventarioJson request = new InventarioJson();
        request.stockActual = new BigDecimal("25.00");
        request.stockMinimo = new BigDecimal("5.00");
        request.materialId = 1;
        request.sucursalId = 1;
        request.createdBy = 1;
        return request;
    }

    private InventarioJson requestConValoresLimite() {
        InventarioJson request = requestValido();
        request.stockActual = new BigDecimal("99999999.99");
        request.stockMinimo = new BigDecimal("99999999.99");
        return request;
    }

    private static class InventarioJson {
        public BigDecimal stockActual;
        public BigDecimal stockMinimo;
        public Integer materialId;
        public Integer sucursalId;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
