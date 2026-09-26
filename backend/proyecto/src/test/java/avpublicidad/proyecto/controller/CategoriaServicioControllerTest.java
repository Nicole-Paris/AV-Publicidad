package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.constants.EstadoConstants;
import avpublicidad.proyecto.model.CategoriaServicio;
import avpublicidad.proyecto.service.CategoriaServicioService;
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

@WebMvcTest(CategoriaServicioController.class)
@Import(SecurityConfig.class)
class CategoriaServicioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CategoriaServicioService categoriaServicioService;

    @Test
    void listar_debeRetornarCategorias() throws Exception {
        when(categoriaServicioService.listar()).thenReturn(List.of(categoria(1), categoria(2)));

        mockMvc.perform(get("/categorias-servicio"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idCategoriaServicio").value(1))
                .andExpect(jsonPath("$[0].estado").value(EstadoConstants.ACTIVO));
    }

    @Test
    void obtenerPorId_debeRetornarCategoria() throws Exception {
        when(categoriaServicioService.obtenerPorId(1)).thenReturn(categoria(1));

        mockMvc.perform(get("/categorias-servicio/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCategoriaServicio").value(1))
                .andExpect(jsonPath("$.nombre").value("Impresion"));
    }

    @Test
    void crear_conValoresValidos_debeRetornarCategoriaCreada() throws Exception {
        when(categoriaServicioService.crear(any())).thenReturn(categoria(1));

        mockMvc.perform(post("/categorias-servicio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCategoriaServicio").value(1));

        verify(categoriaServicioService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(categoriaServicioService.crear(any())).thenReturn(categoriaConValoresLimite());

        mockMvc.perform(post("/categorias-servicio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value(texto(50)))
                .andExpect(jsonPath("$.descripcion").value(texto(100)));

        verify(categoriaServicioService).crear(any());
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarCategoriaActualizada() throws Exception {
        when(categoriaServicioService.actualizar(eq(1), any())).thenReturn(categoria(1));

        mockMvc.perform(put("/categorias-servicio/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCategoriaServicio").value(1));

        verify(categoriaServicioService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(categoriaServicioService).eliminar(1);

        mockMvc.perform(delete("/categorias-servicio/1"))
                .andExpect(status().isOk());

        verify(categoriaServicioService).eliminar(1);
    }

    @Test
    void crear_sinNombre_debeResponderBadRequest() throws Exception {
        CategoriaServicioJson request = requestValido();
        request.nombre = "";

        mockMvc.perform(post("/categorias-servicio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinEstado_debeResponderBadRequest() throws Exception {
        CategoriaServicioJson request = requestValido();
        request.estado = "";

        mockMvc.perform(post("/categorias-servicio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        CategoriaServicioJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/categorias-servicio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        CategoriaServicioJson request = requestConValoresLimite();
        request.nombre = texto(51);
        request.descripcion = texto(101);

        mockMvc.perform(post("/categorias-servicio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(categoriaServicioService);
    }

    private CategoriaServicio categoria(Integer id) {
        return CategoriaServicio.builder()
                .idCategoriaServicio(id)
                .nombre("Impresion")
                .descripcion("Servicios de impresion")
                .estado(EstadoConstants.ACTIVO)
                .createdBy(1)
                .build();
    }

    private CategoriaServicio categoriaConValoresLimite() {
        return CategoriaServicio.builder()
                .idCategoriaServicio(1)
                .nombre(texto(50))
                .descripcion(texto(100))
                .estado(EstadoConstants.ACTIVO)
                .createdBy(1)
                .build();
    }

    private CategoriaServicioJson requestValido() {
        CategoriaServicioJson request = new CategoriaServicioJson();
        request.nombre = "Impresion";
        request.descripcion = "Servicios de impresion";
        request.estado = EstadoConstants.ACTIVO;
        request.createdBy = 1;
        return request;
    }

    private CategoriaServicioJson requestConValoresLimite() {
        CategoriaServicioJson request = requestValido();
        request.nombre = texto(50);
        request.descripcion = texto(100);
        return request;
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class CategoriaServicioJson {
        public String nombre;
        public String descripcion;
        public String estado;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
