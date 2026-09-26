package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.constants.MaterialConstants;
import avpublicidad.proyecto.model.Material;
import avpublicidad.proyecto.service.MaterialService;
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

@WebMvcTest(MaterialController.class)
@Import(SecurityConfig.class)
class MaterialControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private MaterialService materialService;

    @Test
    void listar_debeRetornarMateriales() throws Exception {
        when(materialService.listar()).thenReturn(List.of(material(1), material(2)));

        mockMvc.perform(get("/materiales"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idMaterial").value(1))
                .andExpect(jsonPath("$[0].unidad").value(MaterialConstants.UNIDAD_METROS));
    }

    @Test
    void obtenerPorId_debeRetornarMaterial() throws Exception {
        when(materialService.obtenerPorId(1)).thenReturn(material(1));

        mockMvc.perform(get("/materiales/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idMaterial").value(1))
                .andExpect(jsonPath("$.categoriaMaterialId").value(1));
    }

    @Test
    void crear_conValoresValidos_debeRetornarMaterialCreado() throws Exception {
        when(materialService.crear(any())).thenReturn(material(1));

        mockMvc.perform(post("/materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idMaterial").value(1))
                .andExpect(jsonPath("$.costoUnitario").value(120.50));

        verify(materialService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(materialService.crear(any())).thenReturn(materialConValoresLimite());

        mockMvc.perform(post("/materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value(texto(45)))
                .andExpect(jsonPath("$.costoUnitario").value(99999999.99));
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarMaterialActualizado() throws Exception {
        when(materialService.actualizar(eq(1), any())).thenReturn(material(1));

        mockMvc.perform(put("/materiales/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idMaterial").value(1));

        verify(materialService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(materialService).eliminar(1);

        mockMvc.perform(delete("/materiales/1"))
                .andExpect(status().isOk());

        verify(materialService).eliminar(1);
    }

    @Test
    void crear_sinNombre_debeResponderBadRequest() throws Exception {
        MaterialJson request = requestValido();
        request.nombre = "";

        mockMvc.perform(post("/materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinUnidadYEstado_debeResponderBadRequest() throws Exception {
        MaterialJson request = requestValido();
        request.unidad = "";
        request.estado = "";

        mockMvc.perform(post("/materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCostoUnitario_debeResponderBadRequest() throws Exception {
        MaterialJson request = requestValido();
        request.costoUnitario = null;

        mockMvc.perform(post("/materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCostoUnitarioNegativo_debeResponderBadRequest() throws Exception {
        MaterialJson request = requestValido();
        request.costoUnitario = new BigDecimal("-0.01");

        mockMvc.perform(post("/materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCategoriaMaterial_debeResponderBadRequest() throws Exception {
        MaterialJson request = requestValido();
        request.categoriaMaterialId = null;

        mockMvc.perform(post("/materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        MaterialJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        MaterialJson request = requestConValoresLimite();
        request.nombre = texto(46);
        request.costoUnitario = new BigDecimal("100000000.00");

        mockMvc.perform(post("/materiales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(materialService);
    }

    private Material material(Integer id) {
        return Material.builder()
                .idMaterial(id)
                .nombre("Lona front")
                .unidad(MaterialConstants.UNIDAD_METROS)
                .estado(MaterialConstants.ESTADO_DISPONIBLE)
                .costoUnitario(new BigDecimal("120.50"))
                .categoriaMaterialId(1)
                .createdBy(1)
                .build();
    }

    private Material materialConValoresLimite() {
        return Material.builder()
                .idMaterial(1)
                .nombre(texto(45))
                .unidad(MaterialConstants.UNIDAD_PIEZAS)
                .estado(MaterialConstants.ESTADO_DISPONIBLE)
                .costoUnitario(new BigDecimal("99999999.99"))
                .categoriaMaterialId(1)
                .createdBy(1)
                .build();
    }

    private MaterialJson requestValido() {
        MaterialJson request = new MaterialJson();
        request.nombre = "Lona front";
        request.unidad = MaterialConstants.UNIDAD_METROS;
        request.estado = MaterialConstants.ESTADO_DISPONIBLE;
        request.costoUnitario = new BigDecimal("120.50");
        request.categoriaMaterialId = 1;
        request.createdBy = 1;
        return request;
    }

    private MaterialJson requestConValoresLimite() {
        MaterialJson request = requestValido();
        request.nombre = texto(45);
        request.unidad = MaterialConstants.UNIDAD_PIEZAS;
        request.costoUnitario = new BigDecimal("99999999.99");
        return request;
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class MaterialJson {
        public String nombre;
        public String unidad;
        public String estado;
        public BigDecimal costoUnitario;
        public Integer categoriaMaterialId;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
