package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.constants.GlobalValueConstants;
import avpublicidad.proyecto.model.GlobalValue;
import avpublicidad.proyecto.service.GlobalValueService;
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

@WebMvcTest(GlobalValueController.class)
@Import(SecurityConfig.class)
class GlobalValueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GlobalValueService globalValueService;

    @Test
    void listar_debeRetornarValoresGlobales() throws Exception {
        when(globalValueService.listar()).thenReturn(List.of(globalValue(1), globalValue(2)));

        mockMvc.perform(get("/global-values"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].tipo").value(GlobalValueConstants.TIPO_IMAGEN));
    }

    @Test
    void listar_conTipo_debeRetornarValoresPorTipo() throws Exception {
        when(globalValueService.listarPorTipo(GlobalValueConstants.TIPO_IMAGEN)).thenReturn(List.of(globalValue(1)));

        mockMvc.perform(get("/global-values")
                        .param("tipo", GlobalValueConstants.TIPO_IMAGEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre").value(GlobalValueConstants.NOMBRE_LOGO_URL));

        verify(globalValueService).listarPorTipo(GlobalValueConstants.TIPO_IMAGEN);
    }

    @Test
    void obtenerPorId_debeRetornarValorGlobal() throws Exception {
        when(globalValueService.obtenerPorId(1)).thenReturn(globalValue(1));

        mockMvc.perform(get("/global-values/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.valor").value("https://av.com/logo.png"));
    }

    @Test
    void obtenerPorTipoYNombre_debeRetornarValorGlobal() throws Exception {
        when(globalValueService.obtenerPorTipoYNombre(GlobalValueConstants.TIPO_IMAGEN, GlobalValueConstants.NOMBRE_LOGO_URL))
                .thenReturn(globalValue(1));

        mockMvc.perform(get("/global-values/imagen/logo_url"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value(GlobalValueConstants.NOMBRE_LOGO_URL));
    }

    @Test
    void crear_conValoresValidos_debeRetornarValorCreado() throws Exception {
        when(globalValueService.crear(any())).thenReturn(globalValue(1));

        mockMvc.perform(post("/global-values")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(globalValueService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(globalValueService.crear(any())).thenReturn(globalValueConValoresLimite());

        mockMvc.perform(post("/global-values")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value(texto(45)))
                .andExpect(jsonPath("$.nombre").value(texto(45)));
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarValorActualizado() throws Exception {
        when(globalValueService.actualizar(eq(1), any())).thenReturn(globalValue(1));

        mockMvc.perform(put("/global-values/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(globalValueService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(globalValueService).eliminar(1);

        mockMvc.perform(delete("/global-values/1"))
                .andExpect(status().isOk());

        verify(globalValueService).eliminar(1);
    }

    @Test
    void crear_sinTipoNombreValor_debeResponderBadRequest() throws Exception {
        GlobalValueJson request = requestValido();
        request.tipo = "";
        request.nombre = "";
        request.valor = "";

        mockMvc.perform(post("/global-values")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        GlobalValueJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/global-values")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        GlobalValueJson request = requestConValoresLimite();
        request.tipo = texto(46);
        request.nombre = texto(46);

        mockMvc.perform(post("/global-values")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(globalValueService);
    }

    private GlobalValue globalValue(Integer id) {
        return GlobalValue.builder()
                .id(id)
                .tipo(GlobalValueConstants.TIPO_IMAGEN)
                .nombre(GlobalValueConstants.NOMBRE_LOGO_URL)
                .valor("https://av.com/logo.png")
                .createdBy(1)
                .build();
    }

    private GlobalValue globalValueConValoresLimite() {
        return GlobalValue.builder()
                .id(1)
                .tipo(texto(45))
                .nombre(texto(45))
                .valor("valor")
                .createdBy(1)
                .build();
    }

    private GlobalValueJson requestValido() {
        GlobalValueJson request = new GlobalValueJson();
        request.tipo = GlobalValueConstants.TIPO_IMAGEN;
        request.nombre = GlobalValueConstants.NOMBRE_LOGO_URL;
        request.valor = "https://av.com/logo.png";
        request.createdBy = 1;
        return request;
    }

    private GlobalValueJson requestConValoresLimite() {
        GlobalValueJson request = requestValido();
        request.tipo = texto(45);
        request.nombre = texto(45);
        return request;
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class GlobalValueJson {
        public String tipo;
        public String nombre;
        public String valor;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
