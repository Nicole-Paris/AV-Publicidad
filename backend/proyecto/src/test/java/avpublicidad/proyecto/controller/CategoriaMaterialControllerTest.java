package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.constants.EstadoConstants;
import avpublicidad.proyecto.model.CategoriaMaterial;
import avpublicidad.proyecto.service.CategoriaMaterialService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

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

@WebMvcTest(CategoriaMaterialController.class)
@Import(SecurityConfig.class)
class CategoriaMaterialControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CategoriaMaterialService categoriaMaterialService;

    @Test
    void listar_debeRetornarCategoriasMaterial() throws Exception {
        when(categoriaMaterialService.listar()).thenReturn(List.of(categoria(1), categoria(2)));

        mockMvc.perform(get("/categorias-material"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idCategoriaMaterial").value(1))
                .andExpect(jsonPath("$[0].estado").value(EstadoConstants.ACTIVO));
    }

    @Test
    void obtenerPorId_debeRetornarCategoriaMaterial() throws Exception {
        when(categoriaMaterialService.obtenerPorId(1)).thenReturn(categoria(1));

        mockMvc.perform(get("/categorias-material/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCategoriaMaterial").value(1))
                .andExpect(jsonPath("$.nombre").value("Lonas"));
    }

    @Test
    void crear_conValoresValidos_debeRetornarCategoriaCreada() throws Exception {
        when(categoriaMaterialService.crear(any())).thenReturn(categoria(1));

        mockMvc.perform(post("/categorias-material")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCategoriaMaterial").value(1));

        verify(categoriaMaterialService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(categoriaMaterialService.crear(any())).thenReturn(categoriaConValoresLimite());

        mockMvc.perform(post("/categorias-material")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value(texto(50)))
                .andExpect(jsonPath("$.descripcion").value(texto(100)));
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarCategoriaActualizada() throws Exception {
        when(categoriaMaterialService.actualizar(eq(1), any())).thenReturn(categoria(1));

        mockMvc.perform(put("/categorias-material/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCategoriaMaterial").value(1));

        verify(categoriaMaterialService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(categoriaMaterialService).eliminar(1);

        mockMvc.perform(delete("/categorias-material/1"))
                .andExpect(status().isOk());

        verify(categoriaMaterialService).eliminar(1);
    }

    @Test
    void crear_sinNombre_debeResponderBadRequest() throws Exception {
        CategoriaMaterialJson request = requestValido();
        request.nombre = "";

        mockMvc.perform(post("/categorias-material")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinEstado_debeResponderBadRequest() throws Exception {
        CategoriaMaterialJson request = requestValido();
        request.estado = "";

        mockMvc.perform(post("/categorias-material")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        CategoriaMaterialJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/categorias-material")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        CategoriaMaterialJson request = requestConValoresLimite();
        request.nombre = texto(51);
        request.descripcion = texto(101);

        mockMvc.perform(post("/categorias-material")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(categoriaMaterialService);
    }

    private CategoriaMaterial categoria(Integer id) {
        return CategoriaMaterial.builder()
                .idCategoriaMaterial(id)
                .nombre("Lonas")
                .estado(EstadoConstants.ACTIVO)
                .descripcion("Materiales de lona")
                .createdBy(1)
                .build();
    }

    private CategoriaMaterial categoriaConValoresLimite() {
        return CategoriaMaterial.builder()
                .idCategoriaMaterial(1)
                .nombre(texto(50))
                .estado(EstadoConstants.ACTIVO)
                .descripcion(texto(100))
                .createdBy(1)
                .build();
    }

    private CategoriaMaterialJson requestValido() {
        CategoriaMaterialJson request = new CategoriaMaterialJson();
        request.nombre = "Lonas";
        request.estado = EstadoConstants.ACTIVO;
        request.descripcion = "Materiales de lona";
        request.createdBy = 1;
        return request;
    }

    private CategoriaMaterialJson requestConValoresLimite() {
        CategoriaMaterialJson request = requestValido();
        request.nombre = texto(50);
        request.descripcion = texto(100);
        return request;
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class CategoriaMaterialJson {
        public String nombre;
        public String estado;
        public String descripcion;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
