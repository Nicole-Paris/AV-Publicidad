package avpublicidad.proyecto.service;

import avpublicidad.proyecto.constants.PedidoConstants;
import avpublicidad.proyecto.dto.PedidoRequest;
import avpublicidad.proyecto.exception.ResourceNotFoundException;
import avpublicidad.proyecto.model.Cliente;
import avpublicidad.proyecto.model.DetallePedido;
import avpublicidad.proyecto.model.Inventario;
import avpublicidad.proyecto.model.MovimientoInventario;
import avpublicidad.proyecto.model.Pago;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.model.ServicioMaterial;
import avpublicidad.proyecto.repository.ClienteRepository;
import avpublicidad.proyecto.repository.DetallePedidoRepository;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.InventarioRepository;
import avpublicidad.proyecto.repository.MovimientoInventarioRepository;
import avpublicidad.proyecto.repository.PagoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import avpublicidad.proyecto.repository.ServicioMaterialRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final EmpleadoRepository empleadoRepository;
    private final SucursalRepository sucursalRepository;
    private final PagoRepository pagoRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final ServicioMaterialRepository servicioMaterialRepository;
    private final InventarioRepository inventarioRepository;
    private final MovimientoInventarioRepository movimientoInventarioRepository;

    public List<Pedido> listar() {
        return pedidoRepository.findByDeletedAtIsNull().stream()
                .map(this::agregarEstadoPago)
                .toList();
    }

    public Pedido obtenerPorId(Integer id) {
        Pedido pedido = pedidoRepository.findById(id)
                .filter(pedidoEncontrado -> pedidoEncontrado.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));
        return agregarEstadoPago(pedido);
    }

    @Transactional
    public Pedido crear(PedidoRequest request) {
        validarRelaciones(request);
        validarReglasNegocio(request);
        if (PedidoConstants.FORMA_PAGO_CREDITO.equals(normalizarFormaPago(request.getFormaPago()))
                && PedidoConstants.TIPO_PEDIDO.equals(normalizarTipoPedido(request.getTipoPedido()))) {
            validarCreditoDisponible(request.getClienteId(), request.getTotal(), null);
        }

        Pedido pedido = Pedido.builder()
                .fechaPedido(request.getFechaPedido())
                .fechaEntrega(request.getFechaEntrega())
                .estado(estadoInicialAlCrear(request))
                .total(request.getTotal())
                .descripcion(request.getDescripcion())
                .tipoPedido(normalizarTipoPedido(request.getTipoPedido()))
                .formaPago(normalizarFormaPago(request.getFormaPago()))
                .motivoCancelacion(request.getMotivoCancelacion())
                .clienteId(request.getClienteId())
                .empleadoId(request.getEmpleadoId())
                .sucursalId(request.getSucursalId())
                .createdBy(request.getCreatedBy())
                .updatedBy(request.getUpdatedBy())
                .deletedBy(request.getDeletedBy())
                .build();

        Pedido pedidoGuardado = pedidoRepository.save(pedido);
        aplicarCreditoClienteAlCrearPedido(pedidoGuardado);

        return agregarEstadoPago(pedidoGuardado);
    }

    @Transactional
    public Pedido actualizar(Integer id, PedidoRequest request) {
        Pedido pedido = obtenerPorId(id);
        validarRelaciones(request);
        validarReglasNegocio(request);
        String estadoNuevo = normalizarEstado(request.getEstado());
        if (PedidoConstants.FORMA_PAGO_CREDITO.equals(normalizarFormaPago(request.getFormaPago()))
                && PedidoConstants.TIPO_PEDIDO.equals(normalizarTipoPedido(request.getTipoPedido()))) {
            validarCreditoDisponible(request.getClienteId(), request.getTotal(), id);
        }
        validarFlujoEstado(pedido.getEstado(), estadoNuevo);
        validarPedidoEditable(pedido, request);
        validarRequisitosEstado(pedido, request, estadoNuevo);

        boolean cancelandoPedido = PedidoConstants.ESTADO_CANCELADO.equals(estadoNuevo)
                && !PedidoConstants.ESTADO_CANCELADO.equals(pedido.getEstado());

        if (cancelandoPedido) {
            restaurarMaterialesPedido(pedido, request);
            eliminarPagosPedido(pedido.getIdPedido(), obtenerUsuarioRegistro(request, pedido));
            revertirCreditoCliente(pedido);
        }

        pedido.setFechaPedido(request.getFechaPedido());
        pedido.setFechaEntrega(request.getFechaEntrega());
        pedido.setEstado(estadoNuevo);
        pedido.setTotal(request.getTotal());
        pedido.setDescripcion(request.getDescripcion());
        pedido.setTipoPedido(normalizarTipoPedido(request.getTipoPedido()));
        pedido.setFormaPago(normalizarFormaPago(request.getFormaPago()));
        pedido.setMotivoCancelacion(request.getMotivoCancelacion());
        pedido.setClienteId(request.getClienteId());
        pedido.setEmpleadoId(request.getEmpleadoId());
        pedido.setSucursalId(request.getSucursalId());
        pedido.setCreatedBy(request.getCreatedBy());
        pedido.setUpdatedBy(request.getUpdatedBy());
        pedido.setDeletedBy(request.getDeletedBy());

        return agregarEstadoPago(pedidoRepository.save(pedido));
    }

    public void eliminar(Integer id) {
        Pedido pedido = obtenerPorId(id);
        if (!pagoRepository.findByPedidoIdAndDeletedAtIsNull(id).isEmpty()) {
            throw new ValidationException("No se puede eliminar un pedido con pagos registrados; cancelalo");
        }
        pedido.setDeletedAt(LocalDateTime.now());
        pedidoRepository.save(pedido);
    }

    private void restaurarMaterialesPedido(Pedido pedido, PedidoRequest request) {
        Integer sucursalPedido = request.getSucursalId() != null ? request.getSucursalId() : pedido.getSucursalId();
        List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdAndDeletedAtIsNull(pedido.getIdPedido());
        if (detalles.isEmpty() || sucursalPedido == null) {
            return;
        }

        List<ServicioMaterial> materialesDelServicio = servicioMaterialRepository.findByDeletedAtIsNull();

        for (DetallePedido detalle : detalles) {
            if (detalle.getServicioId() == null || detalle.getCantidad() == null || detalle.getCantidad().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            for (ServicioMaterial asignacion : materialesDelServicio) {
                if (!detalle.getServicioId().equals(asignacion.getServicioId())) {
                    continue;
                }

                BigDecimal cantidadRestaurada = asignacion.getCantidadUsada() == null
                        ? BigDecimal.ZERO
                        : asignacion.getCantidadUsada().multiply(detalle.getCantidad());

                if (cantidadRestaurada.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                inventarioRepository.findByMaterialIdAndSucursalIdAndDeletedAtIsNull(asignacion.getMaterialId(), sucursalPedido)
                        .ifPresent(inventario -> {
                            inventario.setStockActual(inventario.getStockActual().add(cantidadRestaurada));
                            inventarioRepository.save(inventario);

                            movimientoInventarioRepository.save(MovimientoInventario.builder()
                                    .cantidad(cantidadRestaurada)
                                    .fecha(LocalDateTime.now())
                                    .tipo("Entrada")
                                    .motivo("Cancelación de pedido #" + pedido.getIdPedido())
                                    .inventarioId(inventario.getIdInventario())
                                    .createdBy(obtenerUsuarioRegistro(request, pedido))
                                    .build());
                        });
            }
        }
    }

    private void eliminarPagosPedido(Integer pedidoId, Integer usuarioRegistro) {
        List<Pago> pagos = pagoRepository.findByPedidoIdAndDeletedAtIsNull(pedidoId);
        if (pagos.isEmpty()) {
            return;
        }

        LocalDateTime ahora = LocalDateTime.now();
        for (Pago pago : pagos) {
            pago.setDeletedAt(ahora);
            pago.setDeletedBy(usuarioRegistro);
            pago.setUpdatedBy(usuarioRegistro);
            pagoRepository.save(pago);
        }
    }

    private void revertirCreditoCliente(Pedido pedido) {
        if (!PedidoConstants.FORMA_PAGO_CREDITO.equals(pedido.getFormaPago())
                || !PedidoConstants.TIPO_PEDIDO.equals(pedido.getTipoPedido())
                || pedido.getClienteId() == null) {
            return;
        }

        Cliente cliente = clienteRepository.findById(pedido.getClienteId())
                .filter(clienteEncontrado -> clienteEncontrado.getDeletedAt() == null)
                .orElse(null);

        if (cliente == null || pedido.getTotal() == null) {
            return;
        }

        BigDecimal creditoActual = cliente.getCreditoActual() == null ? BigDecimal.ZERO : cliente.getCreditoActual();
        BigDecimal creditoRevertido = creditoActual.subtract(pedido.getTotal());
        if (creditoRevertido.compareTo(BigDecimal.ZERO) < 0) {
            creditoRevertido = BigDecimal.ZERO;
        }

        cliente.setCreditoActual(creditoRevertido);
        clienteRepository.save(cliente);
    }

    private Integer obtenerUsuarioRegistro(PedidoRequest request, Pedido pedido) {
        if (request.getUpdatedBy() != null) {
            return request.getUpdatedBy();
        }
        if (request.getCreatedBy() != null) {
            return request.getCreatedBy();
        }
        return pedido.getUpdatedBy() != null ? pedido.getUpdatedBy() : pedido.getCreatedBy();
    }

    private void validarRelaciones(PedidoRequest request) {
        if (request.getClienteId() != null && !clienteRepository.existsById(request.getClienteId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado");
        }

        if (request.getEmpleadoId() != null && !empleadoRepository.existsById(request.getEmpleadoId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado");
        }

        if (request.getSucursalId() != null && !sucursalRepository.existsById(request.getSucursalId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada");
        }
    }

    private void validarReglasNegocio(PedidoRequest request) {
        if (request.getFechaPedido() != null
                && request.getFechaEntrega() != null
                && request.getFechaEntrega().isBefore(request.getFechaPedido())) {
            throw new ValidationException("La fecha de entrega no puede ser anterior a la fecha del pedido");
        }

        if (request.getTotal() == null || request.getTotal().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("El total del pedido debe capturarse manualmente y ser mayor a cero");
        }

        String estado = normalizarEstado(request.getEstado());
        if (PedidoConstants.ESTADO_CANCELADO.equals(estado)
                && (request.getMotivoCancelacion() == null || request.getMotivoCancelacion().isBlank())) {
            throw new ValidationException("El motivo de cancelacion es obligatorio cuando el pedido esta cancelado");
        }

    }

    private void validarCreditoDisponible(Integer clienteId, BigDecimal totalPedido, Integer pedidoActualId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .filter(clienteEncontrado -> clienteEncontrado.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));

        if (!Boolean.TRUE.equals(cliente.getTieneCredito())) {
            throw new ValidationException("El cliente no tiene credito habilitado");
        }

        BigDecimal limiteCredito = cliente.getLimiteCredito() == null ? BigDecimal.ZERO : cliente.getLimiteCredito();
        if (limiteCredito.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("El cliente no tiene un limite de credito disponible");
        }
        BigDecimal creditoUsado = calcularCreditoUsadoCliente(clienteId, pedidoActualId);
        BigDecimal nuevoCredito = creditoUsado.add(totalPedido == null ? BigDecimal.ZERO : totalPedido);

        if (nuevoCredito.compareTo(limiteCredito) > 0) {
            BigDecimal disponible = limiteCredito.subtract(creditoUsado);
            if (disponible.compareTo(BigDecimal.ZERO) < 0) {
                disponible = BigDecimal.ZERO;
            }
            throw new ValidationException("El pedido excede el limite de credito del cliente. Credito disponible: " + disponible);
        }
    }

    private BigDecimal calcularCreditoUsadoCliente(Integer clienteId, Integer pedidoActualId) {
        return pedidoRepository.findByClienteIdAndFormaPagoAndDeletedAtIsNull(clienteId, PedidoConstants.FORMA_PAGO_CREDITO)
                .stream()
                .filter(pedido -> pedidoActualId == null || !pedidoActualId.equals(pedido.getIdPedido()))
                .filter(pedido -> PedidoConstants.TIPO_PEDIDO.equals(pedido.getTipoPedido()))
                .filter(pedido -> !PedidoConstants.ESTADO_CANCELADO.equals(pedido.getEstado()))
                .map((pedido) -> {
                    BigDecimal totalPedido = pedido.getTotal() == null ? BigDecimal.ZERO : pedido.getTotal();
                    BigDecimal totalPagado = calcularTotalPagado(pedido.getIdPedido());
                    BigDecimal saldoPendiente = totalPedido.subtract(totalPagado);
                    return saldoPendiente.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : saldoPendiente;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void aplicarCreditoClienteAlCrearPedido(Pedido pedido) {
        if (!PedidoConstants.FORMA_PAGO_CREDITO.equals(pedido.getFormaPago())
                || !PedidoConstants.TIPO_PEDIDO.equals(pedido.getTipoPedido())) {
            return;
        }

        Cliente cliente = clienteRepository.findById(pedido.getClienteId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));
        BigDecimal creditoActual = cliente.getCreditoActual() == null ? BigDecimal.ZERO : cliente.getCreditoActual();
        cliente.setCreditoActual(creditoActual.add(pedido.getTotal() == null ? BigDecimal.ZERO : pedido.getTotal()));
        clienteRepository.save(cliente);
    }

    private void validarFlujoEstado(String estadoActual, String estadoNuevo) {
        if (estadoActual == null || estadoActual.equals(estadoNuevo)) {
            return;
        }

        boolean transicionValida =
                (PedidoConstants.ESTADO_BORRADOR.equals(estadoActual)
                        && (PedidoConstants.ESTADO_PENDIENTE.equals(estadoNuevo)
                        || PedidoConstants.ESTADO_CANCELADO.equals(estadoNuevo)))
                        || (PedidoConstants.ESTADO_PENDIENTE.equals(estadoActual)
                        && (PedidoConstants.ESTADO_EN_PROCESO.equals(estadoNuevo)
                        || PedidoConstants.ESTADO_CANCELADO.equals(estadoNuevo)))
                        || (PedidoConstants.ESTADO_EN_PROCESO.equals(estadoActual)
                        && PedidoConstants.ESTADO_TERMINADO.equals(estadoNuevo))
                        || (PedidoConstants.ESTADO_TERMINADO.equals(estadoActual)
                        && PedidoConstants.ESTADO_ENTREGADO.equals(estadoNuevo));

        if (!transicionValida) {
            throw new ValidationException("El pedido no puede cambiar de " + estadoActual + " a " + estadoNuevo);
        }
    }

    private void validarPedidoEditable(Pedido pedido, PedidoRequest request) {
        if (PedidoConstants.ESTADO_BORRADOR.equals(pedido.getEstado())
                || PedidoConstants.ESTADO_PENDIENTE.equals(pedido.getEstado())) {
            return;
        }

        boolean cambioDatosBase = !pedido.getClienteId().equals(request.getClienteId())
                || !pedido.getEmpleadoId().equals(request.getEmpleadoId())
                || !pedido.getSucursalId().equals(request.getSucursalId());

        if (cambioDatosBase) {
            throw new ValidationException("No se puede cambiar cliente, empleado o sucursal cuando el pedido ya esta en proceso");
        }
    }

    private void validarRequisitosEstado(Pedido pedido, PedidoRequest request, String estadoNuevo) {
        if (PedidoConstants.ESTADO_CANCELADO.equals(estadoNuevo)) {
            return;
        }

        if (!PedidoConstants.ESTADO_BORRADOR.equals(estadoNuevo)
                && detallePedidoRepository.findByPedidoIdAndDeletedAtIsNull(pedido.getIdPedido()).isEmpty()) {
            throw new ValidationException("El pedido debe tener al menos un detalle para avanzar de estado");
        }

        if (PedidoConstants.ESTADO_ENTREGADO.equals(estadoNuevo)
                && calcularTotalPagado(pedido.getIdPedido()).compareTo(pedido.getTotal()) < 0) {
            String formaPago = pedido.getFormaPago();
            if (PedidoConstants.FORMA_PAGO_CONTADO.equals(formaPago)) {
                throw new ValidationException("No se puede entregar un pedido de contado con saldo pendiente");
            }

            boolean puedeEntregarConSaldo = PedidoConstants.FORMA_PAGO_CREDITO.equals(formaPago)
                    || PedidoConstants.FORMA_PAGO_INTERCAMBIO.equals(formaPago);
            if (!puedeEntregarConSaldo || !Boolean.TRUE.equals(request.getConfirmarEntregaConSaldoPendiente())) {
                throw new ValidationException("Confirma la entrega con saldo pendiente para pedidos a credito o intercambio");
            }
        }
    }

    private BigDecimal calcularTotalPagado(Integer pedidoId) {
        return pagoRepository.findByPedidoIdAndDeletedAtIsNull(pedidoId).stream()
                .map(pago -> pago.getMonto() == null ? BigDecimal.ZERO : pago.getMonto())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Pedido agregarEstadoPago(Pedido pedido) {
        BigDecimal totalPedido = pedido.getTotal() == null ? BigDecimal.ZERO : pedido.getTotal();
        BigDecimal totalPagado = calcularTotalPagado(pedido.getIdPedido());
        BigDecimal saldoPendiente = totalPedido.subtract(totalPagado);

        if (saldoPendiente.compareTo(BigDecimal.ZERO) < 0) {
            saldoPendiente = BigDecimal.ZERO;
        }

        pedido.setTotalPagado(totalPagado);
        pedido.setSaldoPendiente(saldoPendiente);
        pedido.setEstadoPago(totalPagado.compareTo(totalPedido) >= 0 ? "Pagado" : "Pendiente pago");

        return pedido;
    }

    private String normalizarEstado(String estado) {
        if (estado == null) {
            throw new ValidationException("El estado es obligatorio");
        }

        String valor = estado.trim();
        if (PedidoConstants.ESTADO_BORRADOR.equalsIgnoreCase(valor)) {
            return PedidoConstants.ESTADO_BORRADOR;
        }
        if (PedidoConstants.ESTADO_PENDIENTE.equalsIgnoreCase(valor)) {
            return PedidoConstants.ESTADO_PENDIENTE;
        }
        if (PedidoConstants.ESTADO_EN_PROCESO.equalsIgnoreCase(valor)) {
            return PedidoConstants.ESTADO_EN_PROCESO;
        }
        if (PedidoConstants.ESTADO_TERMINADO.equalsIgnoreCase(valor)) {
            return PedidoConstants.ESTADO_TERMINADO;
        }
        if (PedidoConstants.ESTADO_ENTREGADO.equalsIgnoreCase(valor)) {
            return PedidoConstants.ESTADO_ENTREGADO;
        }
        if (PedidoConstants.ESTADO_CANCELADO.equalsIgnoreCase(valor)) {
            return PedidoConstants.ESTADO_CANCELADO;
        }

        throw new ValidationException("El estado del pedido no es valido");
    }

    private String estadoInicialAlCrear(PedidoRequest request) {
        String tipoPedido = normalizarTipoPedido(request.getTipoPedido());
        if (PedidoConstants.TIPO_COTIZACION.equals(tipoPedido)) {
            return PedidoConstants.ESTADO_BORRADOR;
        }

        return PedidoConstants.ESTADO_PENDIENTE;
    }

    private String normalizarTipoPedido(String tipoPedido) {
        if (tipoPedido == null || tipoPedido.isBlank()) {
            return null;
        }

        String valor = tipoPedido.trim();
        if (PedidoConstants.TIPO_COTIZACION.equalsIgnoreCase(valor)) {
            return PedidoConstants.TIPO_COTIZACION;
        }
        if (PedidoConstants.TIPO_PEDIDO.equalsIgnoreCase(valor)) {
            return PedidoConstants.TIPO_PEDIDO;
        }

        throw new ValidationException("El tipo de pedido debe ser Cotizacion o Pedido");
    }

    private String normalizarFormaPago(String formaPago) {
        if (formaPago == null) {
            throw new ValidationException("La forma de pago es obligatoria");
        }

        String valor = formaPago.trim();
        if (PedidoConstants.FORMA_PAGO_CONTADO.equalsIgnoreCase(valor)) {
            return PedidoConstants.FORMA_PAGO_CONTADO;
        }
        if (PedidoConstants.FORMA_PAGO_CREDITO.equalsIgnoreCase(valor)) {
            return PedidoConstants.FORMA_PAGO_CREDITO;
        }
        if (PedidoConstants.FORMA_PAGO_INTERCAMBIO.equalsIgnoreCase(valor)) {
            return PedidoConstants.FORMA_PAGO_INTERCAMBIO;
        }

        throw new ValidationException("La forma de pago debe ser Contado, Credito o Intercambio");
    }
}
