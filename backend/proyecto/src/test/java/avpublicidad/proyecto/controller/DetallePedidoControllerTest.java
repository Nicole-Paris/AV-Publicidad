package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.constants.DetallePedidoConstants;
import avpublicidad.proyecto.model.DetallePedido;
import avpublicidad.proyecto.service.DetallePedidoService;
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

@WebMvcTest(DetallePedidoController.class)
@Import(SecurityConfig.class)
class DetallePedidoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DetallePedidoService detallePedidoService;

    @Test
    void listar_debeRetornarDetallesPedido() throws Exception {
        when(detallePedidoService.listar()).thenReturn(List.of(detallePedido(1), detallePedido(2)));

        mockMvc.perform(get("/detalles-pedido"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idDetallePedido").value(1))
                .andExpect(jsonPath("$[0].unidadDetalle").value(DetallePedidoConstants.UNIDAD_PIEZAS));
    }

    @Test
    void obtenerPorId_debeRetornarDetallePedido() throws Exception {
        when(detallePedidoService.obtenerPorId(1)).thenReturn(detallePedido(1));

        mockMvc.perform(get("/detalles-pedido/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idDetallePedido").value(1))
                .andExpect(jsonPath("$.pedidoId").value(1))
                .andExpect(jsonPath("$.servicioId").value(1));
    }

    @Test
    void crear_conValoresValidos_debeRetornarDetalleCreado() throws Exception {
        when(detallePedidoService.crear(any())).thenReturn(detallePedido(1));

        mockMvc.perform(post("/detalles-pedido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idDetallePedido").value(1))
                .andExpect(jsonPath("$.subtotal").value(300.00));

        verify(detallePedidoService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(detallePedidoService.crear(any())).thenReturn(detallePedidoConValoresLimite());

        mockMvc.perform(post("/detalles-pedido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cantidad").value(99999999.99))
                .andExpect(jsonPath("$.precioUnitario").value(99999999.99))
                .andExpect(jsonPath("$.subtotal").value(99999999.99));

        verify(detallePedidoService).crear(any());
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarDetalleActualizado() throws Exception {
        when(detallePedidoService.actualizar(eq(1), any())).thenReturn(detallePedido(1));

        mockMvc.perform(put("/detalles-pedido/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idDetallePedido").value(1));

        verify(detallePedidoService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(detallePedidoService).eliminar(1);

        mockMvc.perform(delete("/detalles-pedido/1"))
                .andExpect(status().isOk());

        verify(detallePedidoService).eliminar(1);
    }

    @Test
    void crear_sinPrecioUnitario_debeResponderBadRequest() throws Exception {
        DetallePedidoJson request = requestValido();
        request.precioUnitario = null;

        mockMvc.perform(post("/detalles-pedido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinSubtotal_debeResponderBadRequest() throws Exception {
        DetallePedidoJson request = requestValido();
        request.subtotal = null;

        mockMvc.perform(post("/detalles-pedido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinUnidadDetalle_debeResponderBadRequest() throws Exception {
        DetallePedidoJson request = requestValido();
        request.unidadDetalle = "";

        mockMvc.perform(post("/detalles-pedido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinRelaciones_debeResponderBadRequest() throws Exception {
        DetallePedidoJson request = requestValido();
        request.pedidoId = null;
        request.servicioId = null;

        mockMvc.perform(post("/detalles-pedido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        DetallePedidoJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/detalles-pedido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCantidadNegativa_debeResponderBadRequest() throws Exception {
        DetallePedidoJson request = requestValido();
        request.cantidad = new BigDecimal("-0.01");

        mockMvc.perform(post("/detalles-pedido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        DetallePedidoJson request = requestConValoresLimite();
        request.cantidad = new BigDecimal("100000000.00");
        request.precioUnitario = new BigDecimal("100000000.00");
        request.subtotal = new BigDecimal("100000000.00");

        mockMvc.perform(post("/detalles-pedido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(detallePedidoService);
    }

    private DetallePedido detallePedido(Integer id) {
        return DetallePedido.builder()
                .idDetallePedido(id)
                .cantidad(new BigDecimal("2.00"))
                .precioUnitario(new BigDecimal("150.00"))
                .subtotal(new BigDecimal("300.00"))
                .unidadDetalle(DetallePedidoConstants.UNIDAD_PIEZAS)
                .pedidoId(1)
                .servicioId(1)
                .createdBy(1)
                .build();
    }

    private DetallePedido detallePedidoConValoresLimite() {
        return DetallePedido.builder()
                .idDetallePedido(1)
                .cantidad(new BigDecimal("99999999.99"))
                .precioUnitario(new BigDecimal("99999999.99"))
                .subtotal(new BigDecimal("99999999.99"))
                .unidadDetalle(DetallePedidoConstants.UNIDAD_METROS)
                .pedidoId(1)
                .servicioId(1)
                .createdBy(1)
                .build();
    }

    private DetallePedidoJson requestValido() {
        DetallePedidoJson request = new DetallePedidoJson();
        request.cantidad = new BigDecimal("2.00");
        request.precioUnitario = new BigDecimal("150.00");
        request.subtotal = new BigDecimal("300.00");
        request.unidadDetalle = DetallePedidoConstants.UNIDAD_PIEZAS;
        request.pedidoId = 1;
        request.servicioId = 1;
        request.createdBy = 1;
        return request;
    }

    private DetallePedidoJson requestConValoresLimite() {
        DetallePedidoJson request = requestValido();
        request.cantidad = new BigDecimal("99999999.99");
        request.precioUnitario = new BigDecimal("99999999.99");
        request.subtotal = new BigDecimal("99999999.99");
        request.unidadDetalle = DetallePedidoConstants.UNIDAD_METROS;
        return request;
    }

    private static class DetallePedidoJson {
        public BigDecimal cantidad;
        public BigDecimal precioUnitario;
        public BigDecimal subtotal;
        public String unidadDetalle;
        public Integer pedidoId;
        public Integer servicioId;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
