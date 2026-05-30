package avpublicidad.proyecto.integration;

import avpublicidad.proyecto.constants.EstadoConstants;
import avpublicidad.proyecto.constants.MaterialConstants;
import avpublicidad.proyecto.constants.PagoConstants;
import avpublicidad.proyecto.constants.PedidoConstants;
import avpublicidad.proyecto.constants.RolConstants;
import avpublicidad.proyecto.model.CategoriaMaterial;
import avpublicidad.proyecto.model.CategoriaServicio;
import avpublicidad.proyecto.model.Cliente;
import avpublicidad.proyecto.model.Empleado;
import avpublicidad.proyecto.model.Inventario;
import avpublicidad.proyecto.model.Material;
import avpublicidad.proyecto.model.Rol;
import avpublicidad.proyecto.model.Servicio;
import avpublicidad.proyecto.model.Sucursal;
import avpublicidad.proyecto.repository.CategoriaMaterialRepository;
import avpublicidad.proyecto.repository.CategoriaServicioRepository;
import avpublicidad.proyecto.repository.ClienteRepository;
import avpublicidad.proyecto.repository.CorteCajaRepository;
import avpublicidad.proyecto.repository.DetallePedidoRepository;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.InventarioRepository;
import avpublicidad.proyecto.repository.MaterialRepository;
import avpublicidad.proyecto.repository.MovimientoInventarioRepository;
import avpublicidad.proyecto.repository.PagoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import avpublicidad.proyecto.repository.RolRepository;
import avpublicidad.proyecto.repository.ServicioMaterialRepository;
import avpublicidad.proyecto.repository.ServicioRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BackendIntegrationTest {

    private static final String ADMIN_PASSWORD_HASH =
            "$2a$10$3ybwP10I3b6rHtQckqaN7.70pXPwiX.5kbbLMmhGInHA3ZJPeiCdG";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private SucursalRepository sucursalRepository;

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Autowired
    private CategoriaServicioRepository categoriaServicioRepository;

    @Autowired
    private ServicioRepository servicioRepository;

    @Autowired
    private CategoriaMaterialRepository categoriaMaterialRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private InventarioRepository inventarioRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private MovimientoInventarioRepository movimientoInventarioRepository;

    @Autowired
    private ServicioMaterialRepository servicioMaterialRepository;

    @Autowired
    private CorteCajaRepository corteCajaRepository;

    private Empleado admin;
    private Sucursal sucursal;
    private Cliente cliente;
    private Servicio servicio;
    private Inventario inventario;

    @BeforeEach
    void setUp() {
        limpiarBase();

        Rol rolAdmin = rolRepository.save(Rol.builder()
                .nombre(RolConstants.ADMINISTRADOR)
                .descripcion("Acceso completo")
                .createdBy(1)
                .build());

        sucursal = sucursalRepository.save(Sucursal.builder()
                .nombre("Sucursal Centro")
                .direccion("Av. Principal 123")
                .codigoPostal("62740")
                .telefono("5551112233")
                .horario("Lunes a viernes 09:00 a 18:00")
                .createdBy(1)
                .build());

        admin = empleadoRepository.save(Empleado.builder()
                .nombre("Admin")
                .apellidoPaterno("Sistema")
                .apellidoMaterno("AV")
                .telefono("5551112233")
                .correo("admin@av.com")
                .contrasena(ADMIN_PASSWORD_HASH)
                .horaEntrada(LocalTime.of(9, 0))
                .horaSalida(LocalTime.of(18, 0))
                .rolId(rolAdmin.getIdRol())
                .sucursalIdSucursal(sucursal.getIdSucursal())
                .build());

        CategoriaServicio categoriaServicio = categoriaServicioRepository.save(CategoriaServicio.builder()
                .nombre("Impresion digital")
                .descripcion("Servicios de impresion")
                .estado(EstadoConstants.ACTIVO)
                .createdBy(admin.getIdEmpleado())
                .build());

        servicio = servicioRepository.save(Servicio.builder()
                .nombre("Lona impresa")
                .descripcion("Impresion de lona")
                .estado(EstadoConstants.ACTIVO)
                .categoriaServicioId(categoriaServicio.getIdCategoriaServicio())
                .createdBy(admin.getIdEmpleado())
                .build());

        CategoriaMaterial categoriaMaterial = categoriaMaterialRepository.save(CategoriaMaterial.builder()
                .nombre("Impresion")
                .descripcion("Materiales de impresion")
                .estado(EstadoConstants.ACTIVO)
                .createdBy(admin.getIdEmpleado())
                .build());

        Material material = materialRepository.save(Material.builder()
                .nombre("Lona front 13oz")
                .unidad(MaterialConstants.UNIDAD_METROS)
                .estado(MaterialConstants.ESTADO_DISPONIBLE)
                .costoUnitario(new BigDecimal("45.00"))
                .categoriaMaterialId(categoriaMaterial.getIdCategoriaMaterial())
                .createdBy(admin.getIdEmpleado())
                .build());

        inventario = inventarioRepository.save(Inventario.builder()
                .stockActual(new BigDecimal("100.00"))
                .stockMinimo(new BigDecimal("10.00"))
                .materialId(material.getIdMaterial())
                .sucursalId(sucursal.getIdSucursal())
                .createdBy(admin.getIdEmpleado())
                .build());

        cliente = clienteRepository.save(Cliente.builder()
                .nombre("Carlos")
                .apellidoPaterno("Ramirez")
                .apellidoMaterno("Lopez")
                .tipo("Frecuente")
                .telefono("5551112233")
                .tieneCredito(true)
                .creditoActual(BigDecimal.ZERO)
                .limiteCredito(new BigDecimal("3000.00"))
                .direccion("Av. Principal 123")
                .rfc("RALO900101XYZ")
                .codigoPostal("62740")
                .razonSocial("Carlos Ramirez Lopez")
                .createdBy(admin.getIdEmpleado())
                .build());
    }

    @Test
    void loginYCrearCliente_debeResponderConTokenYCrearRegistro() throws Exception {
        String token = login();

        mockMvc.perform(post("/clientes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(map(
                                "nombre", "Ana",
                                "apellidoPaterno", "Lopez",
                                "apellidoMaterno", "Santos",
                                "telefono", "5552223344",
                                "tipo", "No frecuente",
                                "tieneCredito", false,
                                "creditoActual", 0.00,
                                "limiteCredito", 0.00,
                                "direccion", "Calle Norte 10",
                                "rfc", "LOSA920202ABC",
                                "codigoPostal", "62740",
                                "razonSocial", "Ana Lopez Santos",
                                "createdBy", admin.getIdEmpleado()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCliente").isNumber())
                .andExpect(jsonPath("$.tipo").value("No frecuente"));

        assertThat(clienteRepository.findByDeletedAtIsNull()).hasSize(2);
    }

    @Test
    void flujoPedidoCompleto_debeCrearDetallePagoYEntregar() throws Exception {
        String token = login();

        int pedidoId = postJson("/pedidos", token, map(
                "fechaPedido", "2026-05-24T10:00:00",
                "fechaEntrega", "2026-05-25T18:00:00",
                "estado", PedidoConstants.ESTADO_BORRADOR,
                "total", 1500.00,
                "descripcion", "Pedido de lona",
                "tipoPedido", PedidoConstants.TIPO_PEDIDO,
                "formaPago", PedidoConstants.FORMA_PAGO_CONTADO,
                "clienteId", cliente.getIdCliente(),
                "empleadoId", admin.getIdEmpleado(),
                "sucursalId", sucursal.getIdSucursal(),
                "createdBy", admin.getIdEmpleado()
        )).get("idPedido").asInt();

        mockMvc.perform(post("/detalles-pedido")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "cantidad", 3.00,
                                "precioUnitario", 500.00,
                                "unidadDetalle", "Piezas",
                                "pedidoId", pedidoId,
                                "servicioId", servicio.getIdServicio(),
                                "createdBy", admin.getIdEmpleado()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subtotal").value(1500.00));

        mockMvc.perform(post("/pagos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "monto", 1500.00,
                                "fecha", "2026-05-24",
                                "horaPago", "12:00:00",
                                "referencia", "PAGO-001",
                                "formaPago", PagoConstants.FORMA_PAGO_EFECTIVO,
                                "conceptoPago", PagoConstants.CONCEPTO_PAGO_TOTAL,
                                "pedidoId", pedidoId,
                                "empleadoIdEmpleado", admin.getIdEmpleado(),
                                "createdBy", admin.getIdEmpleado()
                        ))))
                .andExpect(status().isOk());

        actualizarEstadoPedido(token, pedidoId, PedidoConstants.ESTADO_PENDIENTE);
        actualizarEstadoPedido(token, pedidoId, PedidoConstants.ESTADO_EN_PROCESO);
        actualizarEstadoPedido(token, pedidoId, PedidoConstants.ESTADO_TERMINADO);
        actualizarEstadoPedido(token, pedidoId, PedidoConstants.ESTADO_ENTREGADO);

        assertThat(pedidoRepository.findById(pedidoId).orElseThrow().getEstado())
                .isEqualTo(PedidoConstants.ESTADO_ENTREGADO);
    }

    @Test
    void errorValidacion_debeResponderConMensajeYCamposClaros() throws Exception {
        String token = login();

        mockMvc.perform(post("/clientes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "nombre", "",
                                "apellidoPaterno", "",
                                "telefono", "",
                                "tipo", "",
                                "createdBy", admin.getIdEmpleado()
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Hay campos con valores invalidos"))
                .andExpect(jsonPath("$.errors.nombre").exists())
                .andExpect(jsonPath("$.errors.apellidoPaterno").exists())
                .andExpect(jsonPath("$.path").value("/clientes"));
    }

    @Test
    void movimientoInventarioSalida_debeActualizarStock() throws Exception {
        String token = login();

        mockMvc.perform(post("/movimientos-inventario")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "cantidad", 5.00,
                                "fecha", "2026-05-24T13:00:00",
                                "tipo", "Salida",
                                "motivo", "Uso en pedido",
                                "inventarioId", inventario.getIdInventario(),
                                "createdBy", admin.getIdEmpleado()
                        ))))
                .andExpect(status().isOk());

        assertThat(inventarioRepository.findById(inventario.getIdInventario()).orElseThrow().getStockActual())
                .isEqualByComparingTo("95.00");
    }

    private void actualizarEstadoPedido(String token, int pedidoId, String estado) throws Exception {
        mockMvc.perform(put("/pedidos/" + pedidoId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(map(
                                "fechaPedido", "2026-05-24T10:00:00",
                                "fechaEntrega", "2026-05-25T18:00:00",
                                "estado", estado,
                                "total", 1500.00,
                                "descripcion", "Pedido de lona",
                                "tipoPedido", PedidoConstants.TIPO_PEDIDO,
                                "formaPago", PedidoConstants.FORMA_PAGO_CONTADO,
                                "clienteId", cliente.getIdCliente(),
                                "empleadoId", admin.getIdEmpleado(),
                                "sucursalId", sucursal.getIdSucursal(),
                                "createdBy", admin.getIdEmpleado()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value(estado));
    }

    private JsonNode postJson(String path, String token, Map<String, Object> body) throws Exception {
        String response = mockMvc.perform(post(path)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response);
    }

    private String login() throws Exception {
        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "correo", "admin@av.com",
                                "contrasena", "Admin123",
                                "sucursalIdSucursal", sucursal.getIdSucursal()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
    }

    private String json(Map<String, Object> body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    private Map<String, Object> map(Object... values) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i < values.length; i += 2) {
            result.put((String) values[i], values[i + 1]);
        }
        return result;
    }

    private void limpiarBase() {
        movimientoInventarioRepository.deleteAll();
        pagoRepository.deleteAll();
        detallePedidoRepository.deleteAll();
        pedidoRepository.deleteAll();
        corteCajaRepository.deleteAll();
        servicioMaterialRepository.deleteAll();
        inventarioRepository.deleteAll();
        materialRepository.deleteAll();
        categoriaMaterialRepository.deleteAll();
        servicioRepository.deleteAll();
        categoriaServicioRepository.deleteAll();
        clienteRepository.deleteAll();
        empleadoRepository.deleteAll();
        sucursalRepository.deleteAll();
        rolRepository.deleteAll();
    }
}
