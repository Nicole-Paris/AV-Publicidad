package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.model.Sucursal;
import avpublicidad.proyecto.service.SucursalService;
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

@WebMvcTest(SucursalController.class)
@Import(SecurityConfig.class)
class SucursalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SucursalService sucursalService;

    @Test
    void listar_debeRetornarSucursales() throws Exception {
        when(sucursalService.listar()).thenReturn(List.of(sucursal(1), sucursal(2)));

        mockMvc.perform(get("/sucursales"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idSucursal").value(1))
                .andExpect(jsonPath("$[0].nombre").value("Sucursal Centro"));
    }

    @Test
    void obtenerPorId_debeRetornarSucursal() throws Exception {
        when(sucursalService.obtenerPorId(1)).thenReturn(sucursal(1));

        mockMvc.perform(get("/sucursales/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idSucursal").value(1))
                .andExpect(jsonPath("$.codigoPostal").value("62740"));
    }

    @Test
    void crear_conValoresValidos_debeRetornarSucursalCreada() throws Exception {
        when(sucursalService.crear(any())).thenReturn(sucursal(1));

        mockMvc.perform(post("/sucursales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idSucursal").value(1))
                .andExpect(jsonPath("$.telefono").value("5551112233"));

        verify(sucursalService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(sucursalService.crear(any())).thenReturn(sucursalConValoresLimite());

        mockMvc.perform(post("/sucursales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value(texto(50)))
                .andExpect(jsonPath("$.direccion").value(texto(100)))
                .andExpect(jsonPath("$.codigoPostal").value(texto(10)))
                .andExpect(jsonPath("$.telefono").value(texto(15)))
                .andExpect(jsonPath("$.horario").value(texto(100)));

        verify(sucursalService).crear(any());
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarSucursalActualizada() throws Exception {
        when(sucursalService.actualizar(eq(1), any())).thenReturn(sucursal(1));

        mockMvc.perform(put("/sucursales/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idSucursal").value(1));

        verify(sucursalService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(sucursalService).eliminar(1);

        mockMvc.perform(delete("/sucursales/1"))
                .andExpect(status().isOk());

        verify(sucursalService).eliminar(1);
    }

    @Test
    void crear_sinNombre_debeResponderBadRequest() throws Exception {
        SucursalJson request = requestValido();
        request.nombre = "";

        mockMvc.perform(post("/sucursales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinDireccion_debeResponderBadRequest() throws Exception {
        SucursalJson request = requestValido();
        request.direccion = "";

        mockMvc.perform(post("/sucursales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCodigoPostal_debeResponderBadRequest() throws Exception {
        SucursalJson request = requestValido();
        request.codigoPostal = "";

        mockMvc.perform(post("/sucursales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinTelefono_debeResponderBadRequest() throws Exception {
        SucursalJson request = requestValido();
        request.telefono = "";

        mockMvc.perform(post("/sucursales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinHorario_debeResponderBadRequest() throws Exception {
        SucursalJson request = requestValido();
        request.horario = "";

        mockMvc.perform(post("/sucursales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        SucursalJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/sucursales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        SucursalJson request = requestConValoresLimite();
        request.nombre = texto(51);
        request.direccion = texto(101);
        request.codigoPostal = texto(11);
        request.telefono = texto(16);
        request.horario = texto(101);

        mockMvc.perform(post("/sucursales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(sucursalService);
    }

    private Sucursal sucursal(Integer id) {
        return Sucursal.builder()
                .idSucursal(id)
                .nombre("Sucursal Centro")
                .direccion("Av. Principal 123")
                .codigoPostal("62740")
                .telefono("5551112233")
                .horario("Lunes a viernes 9:00 a 18:00")
                .createdBy(2)
                .build();
    }

    private Sucursal sucursalConValoresLimite() {
        return Sucursal.builder()
                .idSucursal(1)
                .nombre(texto(50))
                .direccion(texto(100))
                .codigoPostal(texto(10))
                .telefono(texto(15))
                .horario(texto(100))
                .createdBy(2)
                .build();
    }

    private SucursalJson requestValido() {
        SucursalJson request = new SucursalJson();
        request.nombre = "Sucursal Centro";
        request.direccion = "Av. Principal 123";
        request.codigoPostal = "62740";
        request.telefono = "5551112233";
        request.horario = "Lunes a viernes 9:00 a 18:00";
        request.createdBy = 2;
        return request;
    }

    private SucursalJson requestConValoresLimite() {
        SucursalJson request = requestValido();
        request.nombre = texto(50);
        request.direccion = texto(100);
        request.codigoPostal = texto(10);
        request.telefono = texto(15);
        request.horario = texto(100);
        return request;
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class SucursalJson {
        public String nombre;
        public String direccion;
        public String codigoPostal;
        public String telefono;
        public String horario;
        public Integer createdBy;
        public Integer updatedBy;
        public Integer deletedBy;
    }
}
