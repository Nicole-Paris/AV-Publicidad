package avpublicidad.proyecto.controller;

import avpublicidad.proyecto.config.SecurityConfig;
import avpublicidad.proyecto.constants.ClienteConstants;
import avpublicidad.proyecto.model.Cliente;
import avpublicidad.proyecto.service.ClienteService;
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

@WebMvcTest(ClienteController.class)
@Import(SecurityConfig.class)
class ClienteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ClienteService clienteService;

    @Test
    void listar_debeRetornarClientes() throws Exception {
        when(clienteService.listar()).thenReturn(List.of(cliente(1), cliente(2)));

        mockMvc.perform(get("/clientes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].idCliente").value(1))
                .andExpect(jsonPath("$[0].tipo").value(ClienteConstants.TIPO_FRECUENTE));
    }

    @Test
    void listarFrecuentes_debeRetornarSoloClientesFrecuentes() throws Exception {
        when(clienteService.listarFrecuentes()).thenReturn(List.of(cliente(1)));

        mockMvc.perform(get("/clientes/frecuentes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].tipo").value(ClienteConstants.TIPO_FRECUENTE));
    }

    @Test
    void obtenerPorId_debeRetornarCliente() throws Exception {
        when(clienteService.obtenerPorId(1)).thenReturn(cliente(1));

        mockMvc.perform(get("/clientes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCliente").value(1))
                .andExpect(jsonPath("$.nombre").value("Carlos"));
    }

    @Test
    void crear_conValoresValidos_debeRetornarClienteCreado() throws Exception {
        when(clienteService.crear(any())).thenReturn(cliente(1));

        mockMvc.perform(post("/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCliente").value(1))
                .andExpect(jsonPath("$.rfc").value("RALC900102XYZ"));

        verify(clienteService).crear(any());
    }

    @Test
    void crear_conValoresLimite_debeSerValido() throws Exception {
        when(clienteService.crear(any())).thenReturn(clienteConValoresLimite());

        mockMvc.perform(post("/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestConValoresLimite())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value(texto(50)))
                .andExpect(jsonPath("$.apellidoPaterno").value(texto(45)))
                .andExpect(jsonPath("$.telefono").value(texto(15)))
                .andExpect(jsonPath("$.direccion").value(texto(60)))
                .andExpect(jsonPath("$.rfc").value(texto(15)))
                .andExpect(jsonPath("$.codigoPostal").value(texto(10)))
                .andExpect(jsonPath("$.razonSocial").value(texto(30)));

        verify(clienteService).crear(any());
    }

    @Test
    void actualizar_conValoresValidos_debeRetornarClienteActualizado() throws Exception {
        when(clienteService.actualizar(eq(1), any())).thenReturn(cliente(1));

        mockMvc.perform(put("/clientes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestValido())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCliente").value(1));

        verify(clienteService).actualizar(eq(1), any());
    }

    @Test
    void eliminar_debeResponderOk() throws Exception {
        doNothing().when(clienteService).eliminar(1);

        mockMvc.perform(delete("/clientes/1"))
                .andExpect(status().isOk());

        verify(clienteService).eliminar(1);
    }

    @Test
    void crear_sinNombre_debeResponderBadRequest() throws Exception {
        ClienteJson request = requestValido();
        request.nombre = "";

        mockMvc.perform(post("/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinApellidoPaterno_debeResponderBadRequest() throws Exception {
        ClienteJson request = requestValido();
        request.apellidoPaterno = "";

        mockMvc.perform(post("/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinTelefono_debeResponderBadRequest() throws Exception {
        ClienteJson request = requestValido();
        request.telefono = "";

        mockMvc.perform(post("/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinTipo_debeResponderBadRequest() throws Exception {
        ClienteJson request = requestValido();
        request.tipo = "";

        mockMvc.perform(post("/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_sinCreatedBy_debeResponderBadRequest() throws Exception {
        ClienteJson request = requestValido();
        request.createdBy = null;

        mockMvc.perform(post("/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crear_conCamposQueExcedenLimite_debeResponderBadRequest() throws Exception {
        ClienteJson request = requestConValoresLimite();
        request.nombre = texto(51);
        request.apellidoPaterno = texto(46);
        request.apellidoMaterno = texto(46);
        request.telefono = texto(16);
        request.direccion = texto(61);
        request.rfc = texto(16);
        request.codigoPostal = texto(11);
        request.razonSocial = texto(31);

        mockMvc.perform(post("/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(clienteService);
    }

    private Cliente cliente(Integer id) {
        return Cliente.builder()
                .idCliente(id)
                .nombre("Carlos")
                .apellidoPaterno("Ramirez")
                .apellidoMaterno("Lopez")
                .telefono("5551112233")
                .tipo(ClienteConstants.TIPO_FRECUENTE)
                .tieneCredito(true)
                .creditoActual(BigDecimal.ZERO)
                .limiteCredito(new BigDecimal("3000.00"))
                .direccion("Av. Principal 123")
                .rfc("RALC900102XYZ")
                .codigoPostal("62740")
                .razonSocial("Carlos Ramirez Lopez")
                .createdBy(2)
                .build();
    }

    private Cliente clienteConValoresLimite() {
        return Cliente.builder()
                .idCliente(1)
                .nombre(texto(50))
                .apellidoPaterno(texto(45))
                .apellidoMaterno(texto(45))
                .telefono(texto(15))
                .tipo(ClienteConstants.TIPO_FRECUENTE)
                .tieneCredito(true)
                .creditoActual(BigDecimal.ZERO)
                .limiteCredito(new BigDecimal("99999999.99"))
                .direccion(texto(60))
                .rfc(texto(15))
                .codigoPostal(texto(10))
                .razonSocial(texto(30))
                .createdBy(2)
                .build();
    }

    private ClienteJson requestValido() {
        ClienteJson request = new ClienteJson();
        request.nombre = "Carlos";
        request.apellidoPaterno = "Ramirez";
        request.apellidoMaterno = "Lopez";
        request.telefono = "5551112233";
        request.tipo = ClienteConstants.TIPO_FRECUENTE;
        request.tieneCredito = true;
        request.creditoActual = BigDecimal.ZERO;
        request.limiteCredito = new BigDecimal("3000.00");
        request.direccion = "Av. Principal 123";
        request.rfc = "RALC900102XYZ";
        request.codigoPostal = "62740";
        request.razonSocial = "Carlos Ramirez Lopez";
        request.createdBy = 2;
        return request;
    }

    private ClienteJson requestConValoresLimite() {
        ClienteJson request = requestValido();
        request.nombre = texto(50);
        request.apellidoPaterno = texto(45);
        request.apellidoMaterno = texto(45);
        request.telefono = texto(15);
        request.direccion = texto(60);
        request.rfc = texto(15);
        request.codigoPostal = texto(10);
        request.razonSocial = texto(30);
        return request;
    }

    private String texto(int longitud) {
        return "A".repeat(longitud);
    }

    private static class ClienteJson {
        public String nombre;
        public String apellidoPaterno;
        public String apellidoMaterno;
        public String telefono;
        public String tipo;
        public Boolean tieneCredito;
        public BigDecimal creditoActual;
        public BigDecimal limiteCredito;
        public String direccion;
        public String rfc;
        public String codigoPostal;
        public String razonSocial;
        public Integer createdBy;
    }
}
