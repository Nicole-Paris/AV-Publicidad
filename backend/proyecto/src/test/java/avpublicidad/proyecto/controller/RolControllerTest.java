package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.constants.RolConstants;
import avpublicidad.proyecto.model.Rol;
import avpublicidad.proyecto.service.RolService;
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

@WebMvcTest(RolController.class)
@Import(SecurityConfig.class)
class RolControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RolService rolService;

    @Test
    void listar_debeRetornarRoles() throws Exception {
        when(rolService.listar()).thenReturn(List.of(rol(1), rol(2)));

        mockMvc.perform(get("/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idRol").value(1))
                .andExpect(jsonPath("$[0].nombre").value(RolConstants.ADMINISTRADOR));
    }

    @Test
    void obtenerPorId_debeRetornarRol() throws Exception {
        when(rolService.obtenerPorId(1)).thenReturn(rol(1));

        mockMvc.perform(get("/roles/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idRol").value(1))
                .andExpect(jsonPath("$.descripcion").value("Rol administrador"));
    }

    @Test
    void crear_conValoresValidos_debeRetornarRolCreado() throws Exception {
        when(rolService.crear(any())).thenReturn(rol(1));

        mockMvc.perform(post("/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idRol").value(1))
                .andExpect(jsonPath("$.nombre").value(RolConstants.ADMINISTRADOR));

        verify(rolService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(rolService.crear(any())).thenReturn(rolConValoresLimite());

        mockMvc.perform(post("/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value(texto(50)))
                .andExpect(jsonPath("$.descripcion").value(texto(100)));

        verify(rolService).crear(any());
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarRolActualizado() throws Exception {
        when(rolService.actualizar(eq(1), any())).thenReturn(rol(1));

        mockMvc.perform(put("/roles/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idRol").value(1));

        verify(rolService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(rolService).eliminar(1);

        mockMvc.perform(delete("/roles/1"))
                .andExpect(status().isOk());

        verify(rolService).eliminar(1);
    }

    @Test
    void crear_sinNombre_debeResponderBadRequest() throws Exception {
        RolJson request = requestValido();
        request.nombre = "";

        mockMvc.perform(post("/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinDescripcion_debeResponderBadRequest() throws Exception {
        RolJson request = requestValido();
        request.descripcion = "";

        mockMvc.perform(post("/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        RolJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        RolJson request = requestConValoresLimite();
        request.nombre = texto(51);
        request.descripcion = texto(101);

        mockMvc.perform(post("/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(rolService);
    }

    private Rol rol(Integer id) {
        return Rol.builder()
                .idRol(id)
                .nombre(RolConstants.ADMINISTRADOR)
                .descripcion("Rol administrador")
                .createdBy(1)
                .build();
    }

    private Rol rolConValoresLimite() {
        return Rol.builder()
                .idRol(1)
                .nombre(texto(50))
                .descripcion(texto(100))
                .createdBy(1)
                .build();
    }

    private RolJson requestValido() {
        RolJson request = new RolJson();
        request.nombre = RolConstants.ADMINISTRADOR;
        request.descripcion = "Rol administrador";
        request.createdBy = 1;
        return request;
    }

    private RolJson requestConValoresLimite() {
        RolJson request = requestValido();
        request.nombre = texto(50);
        request.descripcion = texto(100);
        return request;
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class RolJson {
        public String nombre;
        public String descripcion;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
