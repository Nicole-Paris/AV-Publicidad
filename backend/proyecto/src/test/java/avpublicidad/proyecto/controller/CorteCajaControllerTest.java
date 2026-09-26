package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.model.CorteCaja;
import avpublicidad.proyecto.service.CorteCajaService;
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

@WebMvcTest(CorteCajaController.class)
@Import(SecurityConfig.class)
class CorteCajaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CorteCajaService corteCajaService;

    @Test
    void listar_debeRetornarCortesCaja() throws Exception {
        when(corteCajaService.listar()).thenReturn(List.of(corteCaja(1), corteCaja(2)));

        mockMvc.perform(get("/cortes-caja"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idCorteCaja").value(1))
                .andExpect(jsonPath("$[0].empleadoId").value(1));
    }

    @Test
    void obtenerPorId_debeRetornarCorteCaja() throws Exception {
        when(corteCajaService.obtenerPorId(1)).thenReturn(corteCaja(1));

        mockMvc.perform(get("/cortes-caja/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCorteCaja").value(1))
                .andExpect(jsonPath("$.saldoInicial").value(1000.00));
    }

    @Test
    void crear_conValoresValidos_debeRetornarCorteCajaCreado() throws Exception {
        when(corteCajaService.crear(any())).thenReturn(corteCaja(1));

        mockMvc.perform(post("/cortes-caja")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCorteCaja").value(1))
                .andExpect(jsonPath("$.saldoReal").value(1450.00));

        verify(corteCajaService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(corteCajaService.crear(any())).thenReturn(corteCajaConValoresLimite());

        mockMvc.perform(post("/cortes-caja")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saldoInicial").value(99999999.99))
                .andExpect(jsonPath("$.descripcion").value(texto(100)));
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarCorteCajaActualizado() throws Exception {
        when(corteCajaService.actualizar(eq(1), any())).thenReturn(corteCaja(1));

        mockMvc.perform(put("/cortes-caja/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCorteCaja").value(1));

        verify(corteCajaService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(corteCajaService).eliminar(1);

        mockMvc.perform(delete("/cortes-caja/1"))
                .andExpect(status().isOk());

        verify(corteCajaService).eliminar(1);
    }

    @Test
    void crear_sinFechaYHoraInicio_debeResponderBadRequest() throws Exception {
        CorteCajaJson request = requestValido();
        request.fecha = null;
        request.horaInicio = null;

        mockMvc.perform(post("/cortes-caja")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinSaldoInicial_debeResponderBadRequest() throws Exception {
        CorteCajaJson request = requestValido();
        request.saldoInicial = null;

        mockMvc.perform(post("/cortes-caja")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conSaldoInicialNegativo_debeResponderBadRequest() throws Exception {
        CorteCajaJson request = requestValido();
        request.saldoInicial = new BigDecimal("-0.01");

        mockMvc.perform(post("/cortes-caja")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinEmpleado_debeResponderBadRequest() throws Exception {
        CorteCajaJson request = requestValido();
        request.empleadoId = null;

        mockMvc.perform(post("/cortes-caja")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        CorteCajaJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/cortes-caja")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        CorteCajaJson request = requestConValoresLimite();
        request.saldoInicial = new BigDecimal("100000000.00");
        request.saldoEsperado = new BigDecimal("100000000.00");
        request.saldoReal = new BigDecimal("100000000.00");
        request.descripcion = texto(101);

        mockMvc.perform(post("/cortes-caja")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(corteCajaService);
    }

    private CorteCaja corteCaja(Integer id) {
        return CorteCaja.builder()
                .idCorteCaja(id)
                .fecha(LocalDate.of(2026, 5, 24))
                .horaInicio(LocalTime.of(9, 0))
                .horaFin(LocalTime.of(18, 0))
                .saldoInicial(new BigDecimal("1000.00"))
                .saldoEsperado(new BigDecimal("1500.00"))
                .saldoReal(new BigDecimal("1450.00"))
                .diferenciaSaldo(new BigDecimal("-50.00"))
                .descripcion("Corte de caja diario")
                .empleadoId(1)
                .createdBy(1)
                .build();
    }

    private CorteCaja corteCajaConValoresLimite() {
        return CorteCaja.builder()
                .idCorteCaja(1)
                .fecha(LocalDate.of(2026, 5, 24))
                .horaInicio(LocalTime.of(9, 0))
                .saldoInicial(new BigDecimal("99999999.99"))
                .saldoEsperado(new BigDecimal("99999999.99"))
                .saldoReal(new BigDecimal("99999999.99"))
                .diferenciaSaldo(new BigDecimal("-99999999.99"))
                .descripcion(texto(100))
                .empleadoId(1)
                .createdBy(1)
                .build();
    }

    private CorteCajaJson requestValido() {
        CorteCajaJson request = new CorteCajaJson();
        request.fecha = "2026-05-24";
        request.horaInicio = "09:00:00";
        request.horaFin = "18:00:00";
        request.saldoInicial = new BigDecimal("1000.00");
        request.saldoEsperado = new BigDecimal("1500.00");
        request.saldoReal = new BigDecimal("1450.00");
        request.diferenciaSaldo = new BigDecimal("-50.00");
        request.descripcion = "Corte de caja diario";
        request.empleadoId = 1;
        request.createdBy = 1;
        return request;
    }

    private CorteCajaJson requestConValoresLimite() {
        CorteCajaJson request = requestValido();
        request.saldoInicial = new BigDecimal("99999999.99");
        request.saldoEsperado = new BigDecimal("99999999.99");
        request.saldoReal = new BigDecimal("99999999.99");
        request.diferenciaSaldo = new BigDecimal("-99999999.99");
        request.descripcion = texto(100);
        return request;
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class CorteCajaJson {
        public String fecha;
        public String horaInicio;
        public String horaFin;
        public BigDecimal saldoInicial;
        public BigDecimal diferenciaSaldo;
        public String descripcion;
        public BigDecimal saldoEsperado;
        public BigDecimal saldoReal;
        public Integer empleadoId;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
