package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.constants.PagoConstants;
import avpublicidad.proyecto.model.Pago;
import avpublicidad.proyecto.service.PagoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
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

@WebMvcTest(PagoController.class)
@Import(SecurityConfig.class)
class PagoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PagoService pagoService;

    @Test
    void listar_debeRetornarPagos() throws Exception {
        when(pagoService.listar()).thenReturn(List.of(pago(1), pago(2)));

        mockMvc.perform(get("/pagos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idPago").value(1))
                .andExpect(jsonPath("$[0].formaPago").value(PagoConstants.FORMA_PAGO_EFECTIVO));
    }

    @Test
    void obtenerPorId_debeRetornarPago() throws Exception {
        when(pagoService.obtenerPorId(1)).thenReturn(pago(1));

        mockMvc.perform(get("/pagos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idPago").value(1))
                .andExpect(jsonPath("$.pedidoId").value(1))
                .andExpect(jsonPath("$.empleadoIdEmpleado").value(1));
    }

    @Test
    void crear_conValoresValidos_debeRetornarPagoCreado() throws Exception {
        when(pagoService.crear(any())).thenReturn(pago(1));

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idPago").value(1))
                .andExpect(jsonPath("$.monto").value(500.00));

        verify(pagoService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(pagoService.crear(any())).thenReturn(pagoConValoresLimite());

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.monto").value(99999999.99))
                .andExpect(jsonPath("$.referencia").value(texto(50)));

        verify(pagoService).crear(any());
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarPagoActualizado() throws Exception {
        when(pagoService.actualizar(eq(1), any())).thenReturn(pago(1));

        mockMvc.perform(put("/pagos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idPago").value(1));

        verify(pagoService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(pagoService).eliminar(1);

        mockMvc.perform(delete("/pagos/1"))
                .andExpect(status().isOk());

        verify(pagoService).eliminar(1);
    }

    @Test
    void crear_sinMonto_debeResponderBadRequest() throws Exception {
        PagoJson request = requestValido();
        request.monto = null;

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conMontoNegativo_debeResponderBadRequest() throws Exception {
        PagoJson request = requestValido();
        request.monto = new BigDecimal("-0.01");

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinFechaYHora_debeResponderBadRequest() throws Exception {
        PagoJson request = requestValido();
        request.fecha = null;
        request.horaPago = null;

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinReferencia_debeResponderBadRequest() throws Exception {
        PagoJson request = requestValido();
        request.referencia = "";

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinFormaYConceptoPago_debeResponderBadRequest() throws Exception {
        PagoJson request = requestValido();
        request.formaPago = "";
        request.conceptoPago = "";

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinRelaciones_debeResponderBadRequest() throws Exception {
        PagoJson request = requestValido();
        request.pedidoId = null;
        request.empleadoIdEmpleado = null;

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        PagoJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        PagoJson request = requestConValoresLimite();
        request.monto = new BigDecimal("100000000.00");
        request.referencia = texto(51);

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(pagoService);
    }

    private Pago pago(Integer id) {
        return Pago.builder()
                .idPago(id)
                .monto(new BigDecimal("500.00"))
                .fecha(LocalDate.of(2026, 5, 19))
                .horaPago(LocalTime.of(13, 30))
                .referencia("PAGO-001")
                .formaPago(PagoConstants.FORMA_PAGO_EFECTIVO)
                .conceptoPago(PagoConstants.CONCEPTO_ANTICIPO)
                .pedidoId(1)
                .empleadoIdEmpleado(1)
                .createdBy(1)
                .build();
    }

    private Pago pagoConValoresLimite() {
        return Pago.builder()
                .idPago(1)
                .monto(new BigDecimal("99999999.99"))
                .fecha(LocalDate.of(2026, 5, 19))
                .horaPago(LocalTime.of(13, 30))
                .referencia(texto(50))
                .formaPago(PagoConstants.FORMA_PAGO_TRANSFERENCIA)
                .conceptoPago(PagoConstants.CONCEPTO_PAGO_TOTAL)
                .pedidoId(1)
                .empleadoIdEmpleado(1)
                .createdBy(1)
                .build();
    }

    private PagoJson requestValido() {
        PagoJson request = new PagoJson();
        request.monto = new BigDecimal("500.00");
        request.fecha = "2026-05-19";
        request.horaPago = "13:30:00";
        request.referencia = "PAGO-001";
        request.formaPago = PagoConstants.FORMA_PAGO_EFECTIVO;
        request.conceptoPago = PagoConstants.CONCEPTO_ANTICIPO;
        request.pedidoId = 1;
        request.empleadoIdEmpleado = 1;
        request.createdBy = 1;
        return request;
    }

    private PagoJson requestConValoresLimite() {
        PagoJson request = requestValido();
        request.monto = new BigDecimal("99999999.99");
        request.referencia = texto(50);
        request.formaPago = PagoConstants.FORMA_PAGO_TRANSFERENCIA;
        request.conceptoPago = PagoConstants.CONCEPTO_PAGO_TOTAL;
        return request;
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class PagoJson {
        public BigDecimal monto;
        public String fecha;
        public String horaPago;
        public String referencia;
        public String formaPago;
        public String conceptoPago;
        public Integer pedidoId;
        public Integer empleadoIdEmpleado;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
