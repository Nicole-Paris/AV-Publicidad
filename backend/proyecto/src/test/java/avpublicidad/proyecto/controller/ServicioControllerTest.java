package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.constants.EstadoConstants;
import avpublicidad.proyecto.model.Servicio;
import avpublicidad.proyecto.service.ServicioService;
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

@WebMvcTest(ServicioController.class)
@Import(SecurityConfig.class)
class ServicioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ServicioService servicioService;

    @Test
    void listar_debeRetornarServicios() throws Exception {
        when(servicioService.listar()).thenReturn(List.of(servicio(1), servicio(2)));

        mockMvc.perform(get("/servicios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idServicio").value(1))
                .andExpect(jsonPath("$[0].categoriaServicioId").value(1));
    }

    @Test
    void obtenerPorId_debeRetornarServicio() throws Exception {
        when(servicioService.obtenerPorId(1)).thenReturn(servicio(1));

        mockMvc.perform(get("/servicios/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idServicio").value(1))
                .andExpect(jsonPath("$.nombre").value("Lona impresa"));
    }

    @Test
    void crear_conValoresValidos_debeRetornarServicioCreado() throws Exception {
        when(servicioService.crear(any())).thenReturn(servicio(1));

        mockMvc.perform(post("/servicios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idServicio").value(1));

        verify(servicioService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(servicioService.crear(any())).thenReturn(servicioConValoresLimite());

        mockMvc.perform(post("/servicios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value(texto(60)))
                .andExpect(jsonPath("$.descripcion").value(texto(100)));

        verify(servicioService).crear(any());
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarServicioActualizado() throws Exception {
        when(servicioService.actualizar(eq(1), any())).thenReturn(servicio(1));

        mockMvc.perform(put("/servicios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idServicio").value(1));

        verify(servicioService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(servicioService).eliminar(1);

        mockMvc.perform(delete("/servicios/1"))
                .andExpect(status().isOk());

        verify(servicioService).eliminar(1);
    }

    @Test
    void crear_sinNombre_debeResponderBadRequest() throws Exception {
        ServicioJson request = requestValido();
        request.nombre = "";

        mockMvc.perform(post("/servicios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinEstado_debeResponderBadRequest() throws Exception {
        ServicioJson request = requestValido();
        request.estado = "";

        mockMvc.perform(post("/servicios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCategoria_debeResponderBadRequest() throws Exception {
        ServicioJson request = requestValido();
        request.categoriaServicioId = null;

        mockMvc.perform(post("/servicios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        ServicioJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/servicios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        ServicioJson request = requestConValoresLimite();
        request.nombre = texto(61);
        request.descripcion = texto(101);

        mockMvc.perform(post("/servicios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(servicioService);
    }

    private Servicio servicio(Integer id) {
        return Servicio.builder()
                .idServicio(id)
                .nombre("Lona impresa")
                .descripcion("Impresion de lona")
                .estado(EstadoConstants.ACTIVO)
                .categoriaServicioId(1)
                .createdBy(1)
                .build();
    }

    private Servicio servicioConValoresLimite() {
        return Servicio.builder()
                .idServicio(1)
                .nombre(texto(60))
                .descripcion(texto(100))
                .estado(EstadoConstants.ACTIVO)
                .categoriaServicioId(1)
                .createdBy(1)
                .build();
    }

    private ServicioJson requestValido() {
        ServicioJson request = new ServicioJson();
        request.nombre = "Lona impresa";
        request.descripcion = "Impresion de lona";
        request.estado = EstadoConstants.ACTIVO;
        request.categoriaServicioId = 1;
        request.createdBy = 1;
        return request;
    }

    private ServicioJson requestConValoresLimite() {
        ServicioJson request = requestValido();
        request.nombre = texto(60);
        request.descripcion = texto(100);
        return request;
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class ServicioJson {
        public String nombre;
        public String descripcion;
        public String estado;
        public Integer categoriaServicioId;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
