package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.model.ServicioMaterial;
import avpublicidad.proyecto.service.ServicioMaterialService;
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

@WebMvcTest(ServicioMaterialController.class)
@Import(SecurityConfig.class)
class ServicioMaterialControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ServicioMaterialService servicioMaterialService;

    @Test
    void listar_debeRetornarServiciosMateriales() throws Exception {
        when(servicioMaterialService.listar()).thenReturn(List.of(servicioMaterial(1), servicioMaterial(2)));

        mockMvc.perform(get("/servicios-materiales"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idServicioMaterial").value(1))
                .andExpect(jsonPath("$[0].servicioId").value(1));
    }

    @Test
    void obtenerPorId_debeRetornarServicioMaterial() throws Exception {
        when(servicioMaterialService.obtenerPorId(1)).thenReturn(servicioMaterial(1));

        mockMvc.perform(get("/servicios-materiales/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idServicioMaterial").value(1))
                .andExpect(jsonPath("$.materialId").value(1));
    }

    @Test
    void crear_conValoresValidos_debeRetornarServicioMaterialCreado() throws Exception {
        when(servicioMaterialService.crear(any())).thenReturn(servicioMaterial(1));

        mockMvc.perform(post("/servicios-materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idServicioMaterial").value(1))
                .andExpect(jsonPath("$.cantidadUsada").value(2.50));

        verify(servicioMaterialService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(servicioMaterialService.crear(any())).thenReturn(servicioMaterialConValoresLimite());

        mockMvc.perform(post("/servicios-materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cantidadUsada").value(99999999.99));
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarServicioMaterialActualizado() throws Exception {
        when(servicioMaterialService.actualizar(eq(1), any())).thenReturn(servicioMaterial(1));

        mockMvc.perform(put("/servicios-materiales/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idServicioMaterial").value(1));

        verify(servicioMaterialService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(servicioMaterialService).eliminar(1);

        mockMvc.perform(delete("/servicios-materiales/1"))
                .andExpect(status().isOk());

        verify(servicioMaterialService).eliminar(1);
    }

    @Test
    void crear_sinCantidadUsada_debeResponderBadRequest() throws Exception {
        ServicioMaterialJson request = requestValido();
        request.cantidadUsada = null;

        mockMvc.perform(post("/servicios-materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCantidadUsadaNegativa_debeResponderBadRequest() throws Exception {
        ServicioMaterialJson request = requestValido();
        request.cantidadUsada = new BigDecimal("-0.01");

        mockMvc.perform(post("/servicios-materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinRelaciones_debeResponderBadRequest() throws Exception {
        ServicioMaterialJson request = requestValido();
        request.servicioId = null;
        request.materialId = null;

        mockMvc.perform(post("/servicios-materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        ServicioMaterialJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/servicios-materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        ServicioMaterialJson request = requestConValoresLimite();
        request.cantidadUsada = new BigDecimal("100000000.00");

        mockMvc.perform(post("/servicios-materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(servicioMaterialService);
    }

    private ServicioMaterial servicioMaterial(Integer id) {
        return ServicioMaterial.builder()
                .idServicioMaterial(id)
                .cantidadUsada(new BigDecimal("2.50"))
                .servicioId(1)
                .materialId(1)
                .createdBy(1)
                .build();
    }

    private ServicioMaterial servicioMaterialConValoresLimite() {
        return ServicioMaterial.builder()
                .idServicioMaterial(1)
                .cantidadUsada(new BigDecimal("99999999.99"))
                .servicioId(1)
                .materialId(1)
                .createdBy(1)
                .build();
    }

    private ServicioMaterialJson requestValido() {
        ServicioMaterialJson request = new ServicioMaterialJson();
        request.cantidadUsada = new BigDecimal("2.50");
        request.servicioId = 1;
        request.materialId = 1;
        request.createdBy = 1;
        return request;
    }

    private ServicioMaterialJson requestConValoresLimite() {
        ServicioMaterialJson request = requestValido();
        request.cantidadUsada = new BigDecimal("99999999.99");
        return request;
    }

    private static class ServicioMaterialJson {
        public BigDecimal cantidadUsada;
        public Integer servicioId;
        public Integer materialId;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
