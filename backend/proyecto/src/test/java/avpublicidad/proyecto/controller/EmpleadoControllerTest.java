package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.model.Empleado;
import avpublicidad.proyecto.service.EmpleadoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

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

@WebMvcTest(EmpleadoController.class)
@Import(SecurityConfig.class)
class EmpleadoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EmpleadoService empleadoService;

    @Test
    void listar_debeRetornarEmpleados() throws Exception {
        when(empleadoService.listar()).thenReturn(List.of(empleado(1), empleado(2)));

        mockMvc.perform(get("/empleados"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idEmpleado").value(1))
                .andExpect(jsonPath("$[0].correo").value("carlos@av.com"));
    }

    @Test
    void obtenerPorId_debeRetornarEmpleado() throws Exception {
        when(empleadoService.obtenerPorId(1)).thenReturn(empleado(1));

        mockMvc.perform(get("/empleados/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idEmpleado").value(1))
                .andExpect(jsonPath("$.nombre").value("Carlos"));
    }

    @Test
    void crear_conValoresValidos_debeRetornarEmpleadoCreado() throws Exception {
        when(empleadoService.crear(any())).thenReturn(empleado(1));

        mockMvc.perform(post("/empleados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idEmpleado").value(1))
                .andExpect(jsonPath("$.rolId").value(1))
                .andExpect(jsonPath("$.sucursalIdSucursal").value(1));

        verify(empleadoService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(empleadoService.crear(any())).thenReturn(empleadoConValoresLimite());

        mockMvc.perform(post("/empleados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value(texto(50)))
                .andExpect(jsonPath("$.apellidoPaterno").value(texto(45)))
                .andExpect(jsonPath("$.apellidoMaterno").value(texto(45)))
                .andExpect(jsonPath("$.telefono").value(texto(15)))
                .andExpect(jsonPath("$.correo").value(correoLimite()))
                .andExpect(jsonPath("$.contrasena").value(texto(255)));

        verify(empleadoService).crear(any());
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarEmpleadoActualizado() throws Exception {
        when(empleadoService.actualizar(eq(1), any())).thenReturn(empleado(1));

        mockMvc.perform(put("/empleados/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idEmpleado").value(1));

        verify(empleadoService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(empleadoService).eliminar(1);

        mockMvc.perform(delete("/empleados/1"))
                .andExpect(status().isOk());

        verify(empleadoService).eliminar(1);
    }

    @Test
    void crear_sinNombre_debeResponderBadRequest() throws Exception {
        EmpleadoJson request = requestValido();
        request.nombre = "";

        mockMvc.perform(post("/empleados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinApellidoPaterno_debeResponderBadRequest() throws Exception {
        EmpleadoJson request = requestValido();
        request.apellidoPaterno = "";

        mockMvc.perform(post("/empleados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinTelefono_debeResponderBadRequest() throws Exception {
        EmpleadoJson request = requestValido();
        request.telefono = "";

        mockMvc.perform(post("/empleados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCorreo_debeResponderBadRequest() throws Exception {
        EmpleadoJson request = requestValido();
        request.correo = "";

        mockMvc.perform(post("/empleados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCorreoInvalido_debeResponderBadRequest() throws Exception {
        EmpleadoJson request = requestValido();
        request.correo = "correo-invalido";

        mockMvc.perform(post("/empleados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinContrasena_debeResponderBadRequest() throws Exception {
        EmpleadoJson request = requestValido();
        request.contrasena = "";

        mockMvc.perform(post("/empleados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinHoras_debeResponderBadRequest() throws Exception {
        EmpleadoJson request = requestValido();
        request.horaEntrada = null;
        request.horaSalida = null;

        mockMvc.perform(post("/empleados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinRol_debeResponderBadRequest() throws Exception {
        EmpleadoJson request = requestValido();
        request.rolId = null;

        mockMvc.perform(post("/empleados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinSucursal_debeResponderBadRequest() throws Exception {
        EmpleadoJson request = requestValido();
        request.sucursalIdSucursal = null;

        mockMvc.perform(post("/empleados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        EmpleadoJson request = requestConValoresLimite();
        request.nombre = texto(51);
        request.apellidoPaterno = texto(46);
        request.apellidoMaterno = texto(46);
        request.telefono = texto(16);
        request.correo = "a".repeat(64) + "@" + "b".repeat(32) + ".com";
        request.contrasena = texto(256);

        mockMvc.perform(post("/empleados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(empleadoService);
    }

    private Empleado empleado(Integer id) {
        return Empleado.builder()
                .idEmpleado(id)
                .nombre("Carlos")
                .apellidoPaterno("Ramirez")
                .apellidoMaterno("Lopez")
                .telefono("5551112233")
                .correo("carlos@av.com")
                .contrasena("Password123")
                .horaEntrada(LocalTime.of(9, 0))
                .horaSalida(LocalTime.of(18, 0))
                .rolId(1)
                .sucursalIdSucursal(1)
                .build();
    }

    private Empleado empleadoConValoresLimite() {
        return Empleado.builder()
                .idEmpleado(1)
                .nombre(texto(50))
                .apellidoPaterno(texto(45))
                .apellidoMaterno(texto(45))
                .telefono(texto(15))
                .correo(correoLimite())
                .contrasena(texto(255))
                .horaEntrada(LocalTime.of(9, 0))
                .horaSalida(LocalTime.of(18, 0))
                .rolId(1)
                .sucursalIdSucursal(1)
                .build();
    }

    private EmpleadoJson requestValido() {
        EmpleadoJson request = new EmpleadoJson();
        request.nombre = "Carlos";
        request.apellidoPaterno = "Ramirez";
        request.apellidoMaterno = "Lopez";
        request.telefono = "5551112233";
        request.correo = "carlos@av.com";
        request.contrasena = "Password123";
        request.horaEntrada = "09:00:00";
        request.horaSalida = "18:00:00";
        request.rolId = 1;
        request.sucursalIdSucursal = 1;
        return request;
    }

    private EmpleadoJson requestConValoresLimite() {
        EmpleadoJson request = requestValido();
        request.nombre = texto(50);
        request.apellidoPaterno = texto(45);
        request.apellidoMaterno = texto(45);
        request.telefono = texto(15);
        request.correo = correoLimite();
        request.contrasena = texto(255);
        return request;
    }

    private String correoLimite() {
        return "a".repeat(64) + "@" + "b".repeat(31) + ".com";
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class EmpleadoJson {
        public String nombre;
        public String apellidoPaterno;
        public String apellidoMaterno;
        public String telefono;
        public String correo;
        public String contrasena;
        public String horaEntrada;
        public String horaSalida;
        public Integer rolId;
        public Integer sucursalIdSucursal;
    }
}
