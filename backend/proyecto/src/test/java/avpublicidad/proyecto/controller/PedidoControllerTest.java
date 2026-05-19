package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.constants.PedidoConstants;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.service.PedidoService;
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

@WebMvcTest(PedidoController.class)
@Import(SecurityConfig.class)
class PedidoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PedidoService pedidoService;

    @Test
    void listar_debeRetornarPedidos() throws Exception {
        when(pedidoService.listar()).thenReturn(List.of(pedido(1), pedido(2)));

        mockMvc.perform(get("/pedidos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idPedido").value(1))
                .andExpect(jsonPath("$[0].estado").value(PedidoConstants.ESTADO_PENDIENTE));
    }

    @Test
    void obtenerPorId_debeRetornarPedido() throws Exception {
        when(pedidoService.obtenerPorId(1)).thenReturn(pedido(1));

        mockMvc.perform(get("/pedidos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idPedido").value(1))
                .andExpect(jsonPath("$.clienteId").value(1));
    }

    @Test
    void crear_conValoresValidos_debeRetornarPedidoCreado() throws Exception {
        when(pedidoService.crear(any())).thenReturn(pedido(1));

        mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idPedido").value(1))
                .andExpect(jsonPath("$.formaPago").value(PedidoConstants.FORMA_PAGO_CONTADO));

        verify(pedidoService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(pedidoService.crear(any())).thenReturn(pedidoConValoresLimite());

        mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(99999999.99))
                .andExpect(jsonPath("$.descripcion").value(texto(100)))
                .andExpect(jsonPath("$.motivoCancelacion").value(texto(255)));

        verify(pedidoService).crear(any());
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarPedidoActualizado() throws Exception {
        when(pedidoService.actualizar(eq(1), any())).thenReturn(pedido(1));

        mockMvc.perform(put("/pedidos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idPedido").value(1));

        verify(pedidoService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(pedidoService).eliminar(1);

        mockMvc.perform(delete("/pedidos/1"))
                .andExpect(status().isOk());

        verify(pedidoService).eliminar(1);
    }

    @Test
    void crear_sinFechas_debeResponderBadRequest() throws Exception {
        PedidoJson request = requestValido();
        request.fechaPedido = null;
        request.fechaEntrega = null;

        mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinEstado_debeResponderBadRequest() throws Exception {
        PedidoJson request = requestValido();
        request.estado = "";

        mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinTotal_debeResponderBadRequest() throws Exception {
        PedidoJson request = requestValido();
        request.total = null;

        mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conTotalNegativo_debeResponderBadRequest() throws Exception {
        PedidoJson request = requestValido();
        request.total = new BigDecimal("-0.01");

        mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinFormaPago_debeResponderBadRequest() throws Exception {
        PedidoJson request = requestValido();
        request.formaPago = "";

        mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinRelaciones_debeResponderBadRequest() throws Exception {
        PedidoJson request = requestValido();
        request.clienteId = null;
        request.empleadoId = null;
        request.sucursalId = null;

        mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        PedidoJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        PedidoJson request = requestConValoresLimite();
        request.descripcion = texto(101);
        request.motivoCancelacion = texto(256);
        request.total = new BigDecimal("100000000.00");

        mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(pedidoService);
    }

    private Pedido pedido(Integer id) {
        return Pedido.builder()
                .idPedido(id)
                .fechaPedido(LocalDateTime.of(2026, 5, 19, 10, 0))
                .fechaEntrega(LocalDateTime.of(2026, 5, 20, 18, 0))
                .estado(PedidoConstants.ESTADO_PENDIENTE)
                .total(new BigDecimal("1500.00"))
                .descripcion("Pedido de lona")
                .tipoPedido(PedidoConstants.TIPO_PEDIDO)
                .formaPago(PedidoConstants.FORMA_PAGO_CONTADO)
                .clienteId(1)
                .empleadoId(1)
                .sucursalId(1)
                .createdBy(1)
                .build();
    }

    private Pedido pedidoConValoresLimite() {
        return Pedido.builder()
                .idPedido(1)
                .fechaPedido(LocalDateTime.of(2026, 5, 19, 10, 0))
                .fechaEntrega(LocalDateTime.of(2026, 5, 20, 18, 0))
                .estado(PedidoConstants.ESTADO_PENDIENTE)
                .total(new BigDecimal("99999999.99"))
                .descripcion(texto(100))
                .tipoPedido(PedidoConstants.TIPO_PEDIDO)
                .formaPago(PedidoConstants.FORMA_PAGO_CONTADO)
                .motivoCancelacion(texto(255))
                .clienteId(1)
                .empleadoId(1)
                .sucursalId(1)
                .createdBy(1)
                .build();
    }

    private PedidoJson requestValido() {
        PedidoJson request = new PedidoJson();
        request.fechaPedido = "2026-05-19T10:00:00";
        request.fechaEntrega = "2026-05-20T18:00:00";
        request.estado = PedidoConstants.ESTADO_PENDIENTE;
        request.total = new BigDecimal("1500.00");
        request.descripcion = "Pedido de lona";
        request.tipoPedido = PedidoConstants.TIPO_PEDIDO;
        request.formaPago = PedidoConstants.FORMA_PAGO_CONTADO;
        request.clienteId = 1;
        request.empleadoId = 1;
        request.sucursalId = 1;
        request.createdBy = 1;
        return request;
    }

    private PedidoJson requestConValoresLimite() {
        PedidoJson request = requestValido();
        request.total = new BigDecimal("99999999.99");
        request.descripcion = texto(100);
        request.motivoCancelacion = texto(255);
        return request;
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class PedidoJson {
        public String fechaPedido;
        public String fechaEntrega;
        public String estado;
        public BigDecimal total;
        public String descripcion;
        public String tipoPedido;
        public String formaPago;
        public String motivoCancelacion;
        public Integer clienteId;
        public Integer empleadoId;
        public Integer sucursalId;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
