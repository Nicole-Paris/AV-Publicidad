import { useEffect, useMemo, useState } from "react";
import { listarPedidos, actualizarPedido, listarDetallesPedido, descargarNotaPedidoPdf } from "../api/pedidoApi.js";
import { listarPagosPorPedido, listarTodosPagos, crearPago } from "../api/pagoApi.js";
// import listarServicios además de listarClientes
import { listarClientes, listarServicios } from "../api/catalogApi.js";
import { listarEmpleados } from "../api/empleadoApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { esEmpleado } from "../auth/permissions.js";
import { Pagination } from "../components/Pagination.jsx";

const ESTADOS_PEDIDO = ["Borrador", "Pendiente", "En proceso", "Terminado", "Entregado", "Cancelado"];
const ESTADOS_PAGO = ["Pendiente pago", "Pagado"];
const PAGE_SIZE = 30;

const SIGUIENTES_ESTADOS = {
  Borrador: ["Pendiente", "Cancelado"],
  Pendiente: ["En proceso", "Cancelado"],
  "En proceso": ["Terminado"],
  Terminado: ["Entregado"],
  Entregado: [],
  Cancelado: []
};

export function PedidosPage() {
  const { session } = useAuth();
  const soloEmpleado = esEmpleado(session);

  const [tab, setTab] = useState("pedidos");
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  // nuevo estado para servicios
  const [servicios, setServicios] = useState([]);
  const [detallesPorPedido, setDetallesPorPedido] = useState({});
  const [pagosPorPedido, setPagosPorPedido] = useState({});
  const [todosLosPagos, setTodosLosPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");
  const [pedidoExpandido, setPedidoExpandido] = useState(null);
  const [modalPago, setModalPago] = useState(null);
  const [formPago, setFormPago] = useState({
    monto: "", formaPago: "Efectivo", referencia: "",
    conceptoPago: "Anticipo", fecha: "", horaPago: "",
    pagoDividido: false, pedidoId: ""
  });
  const [buscarPedido, setBuscarPedido] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroEstadoPago, setFiltroEstadoPago] = useState("");
  const [buscarPago, setBuscarPago] = useState("");
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [paginaPagos, setPaginaPagos] = useState(1);
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [pedidoExpandidoPagos, setPedidoExpandidoPagos] = useState(null);
  
  // Nuevo: estados para modal pago con buscador
  const [buscarPedidoModal, setBuscarPedidoModal] = useState("");
  const [pedidoSugerencias, setPedidoSugerencias] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [confirmarEntregaPendiente, setConfirmarEntregaPendiente] = useState(null);
  const [pedidoCancelar, setPedidoCancelar] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [descargandoPdf, setDescargandoPdf] = useState(null);
  const sucursalActivaId = session?.sucursalIdSucursal || session?.sucursalId;

  function mostrarError(msg) {
    setModalError(msg);
  }
  function mostrarSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }
  function money(v) {
    return new Intl.NumberFormat("es-MX", { currency: "MXN", style: "currency" }).format(v || 0);
  }
  async function exportarPedidoPdf(pedidoObj) {
    setDescargandoPdf(pedidoObj.idPedido);
    try {
      const blob = await descargarNotaPedidoPdf(pedidoObj.idPedido);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pedido-${pedidoObj.idPedido}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setDescargandoPdf(null);
    }
  }
  function nombreCliente(c) {
    return [c?.nombre, c?.apellidoPaterno, c?.apellidoMaterno].filter(Boolean).join(" ");
  }
  function clienteDePedido(p) {
    return clientes.find(c => Number(c.idCliente) === Number(p.clienteId));
  }

  function nombreEmpleado(id) {
    const empleado = empleados.find(e => Number(e.idEmpleado) === Number(id));
    if (!empleado) {
      return `Empleado ${id || "-"}`;
    }

    return [empleado.nombre, empleado.apellidoPaterno, empleado.apellidoMaterno]
      .filter(Boolean)
      .join(" ");
  }

  function pagosDePedido(pedidoId) {
    return (todosLosPagos || []).filter(pago => Number(pago.pedidoId) === Number(pedidoId));
  }

  function totalPagadoPedido(pedidoId) {
    return pagosDePedido(pedidoId).reduce((total, pago) => total + Number(pago.monto || 0), 0);
  }

  function saldoPendientePedido(pedidoObj) {
    return Math.max(0, Number(pedidoObj?.total || 0) - totalPagadoPedido(pedidoObj?.idPedido));
  }

  function estadoPagoPedido(pedidoObj) {
    if (pedidoObj?.estadoPago) {
      return pedidoObj.estadoPago;
    }

    return saldoPendientePedido(pedidoObj) <= 0 ? "Pagado" : "Pendiente pago";
  }

  function montoPagoActual() {
    if (pedidoSeleccionado?.formaPago === "Intercambio") {
      return Number(pedidoSeleccionado.total || 0).toFixed(2);
    }

    if (formPago.conceptoPago === "Liquidacion") {
      return saldoPendientePedido(pedidoSeleccionado).toFixed(2);
    }

    return formPago.monto;
  }

  function montoPagoBloqueado() {
    return pedidoSeleccionado?.formaPago === "Intercambio" || formPago.conceptoPago === "Liquidacion";
  }

  function puedeCambiarEstado(estadoActual, estadoNuevo) {
    return estadoActual === estadoNuevo || (SIGUIENTES_ESTADOS[estadoActual] || []).includes(estadoNuevo);
  }

  function opcionesEstado(estadoActual) {
    return ESTADOS_PEDIDO.map(estado => ({
      estado,
      disabled: !puedeCambiarEstado(estadoActual, estado)
    }));
  }

  function claseEstado(estado) {
    if (estado === "Pendiente") return "pending";
    if (estado === "En proceso") return "process";
    if (estado === "Terminado") return "finished";
    if (estado === "Entregado") return "delivered";
    if (estado === "Cancelado") return "cancelled";
    return "draft";
  }

  function formaPagoInicial(pedidoObj) {
    return pedidoObj?.formaPago === "Intercambio" ? "Intercambio" : "Efectivo";
  }

  function conceptoPagoInicial(pedidoObj) {
    if (pedidoObj?.formaPago === "Intercambio") {
      return "Liquidacion";
    }

    return "Anticipo";
  }

  function opcionesConceptoPago(pedidoObj) {
    if (pedidoObj?.formaPago === "Intercambio") {
      return [{ value: "Liquidacion", label: "Liquidacion" }];
    }

    const opciones = [
      { value: "Anticipo", label: "Anticipo" },
      { value: "Liquidacion", label: "Liquidacion" },
      { value: "Abono", label: "Abono" }
    ];

    if (pedidoObj?.formaPago === "Credito") {
      opciones.splice(1, 0, { value: "Abono_credito", label: "Abono a credito" });
    }

    return opciones;
  }

  function actualizarMontoPago(value) {
    const limpio = value.replace(/[^\d.]/g, "");
    const partes = limpio.split(".");
    const monto = partes.length > 1 ? `${partes[0]}.${partes.slice(1).join("")}` : limpio;
    setFormPago(f => ({ ...f, monto }));
  }

  // helper para resolver nombre de servicio desde catálogo
  function nombreServicio(servicioId) {
    const s = servicios.find(sv => Number(sv.idServicio) === Number(servicioId));
    return s ? s.nombre : `Servicio ${servicioId}`;
  }

  useEffect(() => {
    let active = true;
    async function cargar() {
      setLoading(true);
      try {
        // ahora también cargamos servicios
        const [ps, cs, pagos, svcs, emps] = await Promise.all([
          listarPedidos(),
          listarClientes(),
          listarTodosPagos(),
          listarServicios(),
          listarEmpleados()
        ]);
        if (!active) return;
        setPedidos((ps || []).slice().sort((a, b) => Number(b.idPedido) - Number(a.idPedido)));
        setClientes(cs || []);
        setTodosLosPagos(pagos || []);
        setServicios(svcs || []);
        setEmpleados(emps || []);
      } catch (err) {
        if (active) mostrarError(err.message || String(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    cargar();
    return () => { active = false; };
  }, []);

  // Mantener fecha/hora del formulario de pago actualizada mientras el modal está abierto
  useEffect(() => {
    if (!modalPago) return;
    const interval = setInterval(() => {
      const now = new Date();
      setFormPago(f => ({
        ...f,
        fecha: now.toISOString().slice(0, 10),
        horaPago: now.toTimeString().slice(0, 8)
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, [modalPago]);

  function badgeEstado(estado) {
    if (estado === "Borrador") return <span className="inv-badge neutral">Borrador</span>;
    if (estado === "En proceso") return <span className="inv-badge warn">En proceso</span>;
    if (estado === "Terminado") return <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>Terminado</span>;
    if (estado === "Entregado") return <span className="inv-badge ok">Entregado</span>;
    return <span className="inv-badge neutral">{estado}</span>;
  }

  const pedidosFiltrados = useMemo(() => {
    const q = (buscarPedido || "").trim().toLowerCase();
    return pedidos.filter(p => {
      const matchSucursal = !sucursalActivaId || Number(p.sucursalId) === Number(sucursalActivaId);
      const cliente = clienteDePedido(p);
      const nombre = cliente ? nombreCliente(cliente).toLowerCase() : "";
      const matchBuscar = !q || nombre.includes(q) || String(p.idPedido).includes(q);
      const matchEstado = !filtroEstado || p.estado === filtroEstado;
      const matchEstadoPago = !filtroEstadoPago || estadoPagoPedido(p) === filtroEstadoPago;
      return matchSucursal && matchBuscar && matchEstado && matchEstadoPago;
    });
  }, [pedidos, buscarPedido, filtroEstado, filtroEstadoPago, clientes, todosLosPagos, sucursalActivaId]);

  const pedidosPaginados = useMemo(() => {
    const inicio = (paginaPedidos - 1) * PAGE_SIZE;
    return pedidosFiltrados.slice(inicio, inicio + PAGE_SIZE);
  }, [pedidosFiltrados, paginaPedidos]);

  useEffect(() => {
    setPaginaPedidos(1);
  }, [buscarPedido, filtroEstado, filtroEstadoPago, sucursalActivaId]);

  async function expandirPedido(idPedido) {
    if (pedidoExpandido === idPedido) {
      setPedidoExpandido(null);
      return;
    }
    setLoadingDetalle(true);
    try {
      // listarDetallesPedido puede devolver todos los detalles; filtrar por pedidoId
      const detsRaw = await listarDetallesPedido(idPedido);
      const dets = Array.isArray(detsRaw)
        ? detsRaw.filter(d => Number(d.pedidoId) === Number(idPedido))
        : [];
      setDetallesPorPedido(prev => ({ ...prev, [idPedido]: dets }));
      setPedidoExpandido(idPedido);
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setLoadingDetalle(false);
    }
  }

  function abrirModalPagoDesdeExpandido(pedidoObj) {
    const now = new Date();
    const fecha = now.toISOString().slice(0,10);
    const horaPago = now.toTimeString().slice(0,8);
    setFormPago({
      monto: "",
      formaPago: formaPagoInicial(pedidoObj),
      referencia: "",
      conceptoPago: conceptoPagoInicial(pedidoObj),
      fecha, horaPago, pagoDividido: pedidoObj.pagoDividido || false, pedidoId: String(pedidoObj.idPedido)
    });
    // reset y preseleccionar pedido en modal buscador
    setBuscarPedidoModal(`${pedidoObj.idPedido} — ${clienteDePedido(pedidoObj) ? nombreCliente(clienteDePedido(pedidoObj)) : `Cliente ${pedidoObj.clienteId}`}`);
    setPedidoSugerencias([]);
    setPedidoSeleccionado(pedidoObj);
    setModalPago({ pedido: pedidoObj, desdePedido: true });
  }

  function abrirModalPagoDesdeTab() {
    const now = new Date();
    const fecha = now.toISOString().slice(0,10);
    const horaPago = now.toTimeString().slice(0,8);
    setFormPago({ monto: "", formaPago: "Efectivo", referencia: "", conceptoPago: "Anticipo", fecha, horaPago, pagoDividido: false, pedidoId: "" });
    // reset buscador
    setBuscarPedidoModal("");
    setPedidoSugerencias([]);
    setPedidoSeleccionado(null);
    setModalPago({ pedido: null, desdePedido: false });
  }

  async function guardarPago() {
    const pedidoId = Number(formPago.pedidoId);
    const monto = montoPagoActual();
    if (!pedidoId) { mostrarError("Selecciona un pedido."); return; }
    if (!monto || Number(monto) <= 0) { mostrarError("Ingresa un monto válido."); return; }

    if (!formPago.referencia.trim()) { mostrarError("La referencia es obligatoria."); return; }

    const ped = pedidos.find(p => Number(p.idPedido) === pedidoId);
    const pendiente = ped ? saldoPendientePedido(ped) : 0;
    if (ped?.formaPago !== "Intercambio" && Number(monto) > pendiente) { mostrarError(`El monto excede el pendiente (${money(pendiente)}).`); return; }

    setSaving(true);
    try {
      await crearPago({
        monto: Number(monto).toFixed(2),
        fecha: formPago.fecha,
        horaPago: formPago.horaPago,
        referencia: formPago.referencia,
        formaPago: formPago.formaPago,
        conceptoPago: formPago.conceptoPago,
        pedidoId,
        empleadoIdEmpleado: session.empleadoId,
        createdBy: session.empleadoId
      });

      const [nuevosPagos, todosActualizados] = await Promise.all([
        listarPagosPorPedido(pedidoId),
        listarTodosPagos()
      ]);
      setPagosPorPedido(prev => ({ ...prev, [pedidoId]: nuevosPagos || [] }));
      setTodosLosPagos(todosActualizados || []);

      setModalPago(null);
      mostrarSuccess("Pago registrado correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function cambiarEstado(pedidoObj, nuevoEstado) {
    if (!puedeCambiarEstado(pedidoObj.estado, nuevoEstado)) {
      mostrarError(`El pedido no puede cambiar de ${pedidoObj.estado} a ${nuevoEstado}.`);
      return;
    }

    if (nuevoEstado === "Cancelado") {
      setPedidoCancelar(pedidoObj);
      setMotivoCancelacion(pedidoObj.motivoCancelacion || "");
      return;
    }

    if (nuevoEstado === "Entregado" && saldoPendientePedido(pedidoObj) > 0) {
      if (pedidoObj.formaPago === "Contado") {
        mostrarError("No se puede entregar un pedido de contado con saldo pendiente.");
        return;
      }
      setConfirmarEntregaPendiente(pedidoObj);
      return;
    }

    await guardarEstadoPedido(pedidoObj, nuevoEstado);
  }

  async function confirmarCancelacion() {
    if (!pedidoCancelar) {
      return;
    }

    if (!motivoCancelacion.trim()) {
      mostrarError("El motivo de cancelacion es obligatorio.");
      return;
    }

    const pedidoObj = pedidoCancelar;
    const motivo = motivoCancelacion.trim();
    setPedidoCancelar(null);
    setMotivoCancentelacion("");
    await guardarEstadoPedido({ ...pedidoObj, motivoCancelacion: motivo }, "Cancelado");
  }

  async function guardarEstadoPedido(pedidoObj, nuevoEstado, confirmarEntregaConSaldoPendiente = false) {
    setCambiandoEstado(pedidoObj.idPedido);
    try {
      await actualizarPedido(pedidoObj.idPedido, {
        ...pedidoObj,
        estado: nuevoEstado,
        motivoCancelacion: pedidoObj.motivoCancelacion,
        updatedBy: session.empleadoId,
        confirmarEntregaConSaldoPendiente
      });
      const ps = await listarPedidos();
      setPedidos((ps || []).slice().sort((a,b) => Number(b.idPedido) - Number(a.idPedido)));
      mostrarSuccess("Estado actualizado.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setCambiandoEstado(null);
    }
  }

  async function confirmarEntregaConSaldo() {
    if (!confirmarEntregaPendiente) {
      return;
    }

    const pedidoObj = confirmarEntregaPendiente;
    setConfirmarEntregaPendiente(null);
    await guardarEstadoPedido(pedidoObj, "Entregado", true);
  }

  const pagosFiltrados = useMemo(() => {
    const q = (buscarPago || "").trim().toLowerCase();
    return (todosLosPagos || []).filter(p => {
      const pedidoPago = pedidos.find(pedido => Number(pedido.idPedido) === Number(p.pedidoId));
      const matchSucursal = !sucursalActivaId || Number(pedidoPago?.sucursalId) === Number(sucursalActivaId);
      const matchBuscar = !q || String(p.pedidoId).includes(q) || (p.formaPago || "").toLowerCase().includes(q) || (p.conceptoPago || "").toLowerCase().includes(q);
      return matchSucursal && matchBuscar;
    });
  }, [todosLosPagos, buscarPago, pedidos, sucursalActivaId]);

  const gruposPagos = useMemo(() => {
    const grupos = {};
    (pagosFiltrados || []).forEach(pago => {
      const id = String(pago.pedidoId);
      if (!grupos[id]) grupos[id] = [];
      grupos[id].push(pago);
    });

    return Object.entries(grupos);
  }, [pagosFiltrados]);

  const pagosPaginados = useMemo(() => {
    const inicio = (paginaPagos - 1) * PAGE_SIZE;
    return gruposPagos.slice(inicio, inicio + PAGE_SIZE);
  }, [gruposPagos, paginaPagos]);

  useEffect(() => {
    setPaginaPagos(1);
  }, [buscarPago, sucursalActivaId]);

  return (
    <section className="page-stack">
      {success && <div className="pos-alert success">{success}</div>}

      <div className="inv-tabs">
        <button className={tab === "pedidos" ? "inv-tab active" : "inv-tab"} onClick={() => setTab("pedidos")} type="button">Pedidos</button>
        <button className={tab === "pagos" ? "inv-tab active" : "inv-tab"} onClick={() => setTab("pagos")} type="button">Pagos</button>
      </div>

      {tab === "pedidos" && (
        <>
          <div className="inv-toolbar">
            <input
              placeholder="Buscar por cliente o Número de pedido..."
              value={buscarPedido}
              onChange={e => setBuscarPedido(e.target.value)}
              style={{ flex: 1 }}
              disabled={loading}
            />
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} disabled={loading}>
              <option value="">Todos los estados</option>
              {ESTADOS_PEDIDO.map(estado => <option key={estado}>{estado}</option>)}
            </select>
            <select value={filtroEstadoPago} onChange={e => setFiltroEstadoPago(e.target.value)} disabled={loading}>
              <option value="">Todos los pagos</option>
              {ESTADOS_PAGO.map(estado => <option key={estado}>{estado}</option>)}
            </select>
          </div>

          <div className="pedidos-lista">
            {pedidosPaginados.map(pedido => {
              const cliente = clienteDePedido(pedido);
              const expandido = pedidoExpandido === pedido.idPedido;
              const totalPagado = totalPagadoPedido(pedido.idPedido);
              const pendiente = saldoPendientePedido(pedido);
              const estadoPago = estadoPagoPedido(pedido);
              const pagosDelPedido = pagosDePedido(pedido.idPedido);

              return (
                <div key={pedido.idPedido} className="pedido-card">
                  <div className="pedido-header" onClick={() => expandirPedido(pedido.idPedido)}>
                    <div className="pedido-header-left">
                      <span className="pedido-num">{pedido.idPedido}</span>
                      <div>
                        <p className="pedido-cliente">{cliente ? nombreCliente(cliente) : `Cliente ${pedido.clienteId}`}</p>
                        <p className="pedido-fecha">{pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleDateString("es-MX") : "—"}</p>
                      </div>
                    </div>
                    <div className="pedido-header-right">
                      {pedido.pagoDividido && <span className="inv-badge neutral" style={{fontSize:12}}>Dividido</span>}
                      <span className={estadoPago === "Pagado" ? "inv-badge ok" : "inv-badge warn"} style={{fontSize:12}}>
                        {estadoPago}
                      </span>
                      <strong className="pedido-total">Resta: {money(pendiente)}</strong>
                      <select
                        value={pedido.estado}
                        disabled={cambiandoEstado === pedido.idPedido}
                        onClick={e => e.stopPropagation()}
                        onChange={e => cambiarEstado(pedido, e.target.value)}
                        className={`pedido-status-select ${claseEstado(pedido.estado)}`}
                      >
                        {opcionesEstado(pedido.estado).map(({ estado, disabled }) => (
                          <option key={estado} disabled={disabled}>
                            {estado}
                          </option>
                        ))}
                      </select>
                       <button
                         className="pedido-payment-button"
                         type="button"
                         onClick={e => {
                           e.stopPropagation();
                           abrirModalPagoDesdeExpandido(pedido);
                         }}
                       >
                         Pago
                       </button>
                       {!soloEmpleado && (
                         <button
                           className="pedido-pdf-button"
                           disabled={descargandoPdf === pedido.idPedido}
                           type="button"
                           onClick={e => {
                             e.stopPropagation();
                             exportarPedidoPdf(pedido);
                           }}
                         >
                           {descargandoPdf === pedido.idPedido ? "..." : "PDF"}
                         </button>
                       )}
                       <span className="pedido-chevron">{expandido ? "▲" : "▼"}</span>
                     </div>
                  </div>

                  {expandido && (
                    <div className="pedido-detalle">
                      {/* Solo mostrar la fecha de entrega y la tabla de servicios */}
                      <p style={{fontSize:14, color:"#64748b", margin:"0 0 12px"}}>
                        Entrega: <strong>{pedido.fechaEntrega ? new Date(pedido.fechaEntrega).toLocaleDateString("es-MX") : "—"}</strong>
                        {" · "}
                        Forma de pago: <strong>{pedido.formaPago || "—"}</strong>
                        {" · "}
                        Creado por: <strong>{nombreEmpleado(pedido.createdBy || pedido.empleadoId)}</strong>
                      </p>

                      <h3>Servicios del pedido</h3>
                      {loadingDetalle ? (
                        <p style={{color:"#64748b",fontSize:14}}>Cargando detalles...</p>
                      ) : (detallesPorPedido[pedido.idPedido] || []).length > 0 ? (
                        <div className="inv-table-wrap" style={{marginTop:8}}>
                          <table className="inv-table">
                            <thead>
                              <tr>
                                <th>Servicio</th>
                                <th>Cantidad</th>
                                <th>Unidad</th>
                                <th>P. Unit.</th>
                                <th>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(detallesPorPedido[pedido.idPedido] || []).map((d, i) => (
                                <tr key={d.idDetallePedido || d.idDetalle || i}>
                                  <td>{nombreServicio(d.servicioId)}</td>
                                  <td>{Number(d.cantidad)}</td>
                                  <td>{d.unidadDetalle || "—"}</td>
                                  <td>{money(Number(d.precioUnitario))}</td>
                                  <td>{money(Number(d.cantidad) * Number(d.precioUnitario))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{color:"#64748b",fontSize:14}}>Sin servicios registrados.</p>
                      )}

                      <div className="pedido-payments-header">
                        <h3>Pagos realizados</h3>
                        <div className="pedido-payment-totals">
                          <span>Pagado: <strong>{money(totalPagado)}</strong></span>
                          <span>Pendiente: <strong className={pendiente > 0 ? "debt" : "paid"}>{money(pendiente)}</strong></span>
                        </div>
                      </div>
                      {pagosDelPedido.length > 0 ? (
                        <div className="inv-table-wrap" style={{marginTop:8}}>
                          <table className="inv-table">
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Forma</th>
                                <th>Concepto</th>
                                <th>Monto</th>
                                <th>Recibio</th>
                                <th>Referencia</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagosDelPedido.map((pago, i) => (
                                <tr key={pago.idPago || i}>
                                  <td>{pago.fecha ? new Date(pago.fecha).toLocaleDateString("es-MX") : "—"}</td>
                                  <td>{pago.horaPago ? pago.horaPago.slice(0, 5) : "—"}</td>
                                  <td>{pago.formaPago || "—"}</td>
                                  <td>{pago.conceptoPago || "—"}</td>
                                  <td>{money(pago.monto)}</td>
                                  <td>{nombreEmpleado(pago.empleadoIdEmpleado || pago.createdBy)}</td>
                                  <td>{pago.referencia || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{color:"#64748b",fontSize:14}}>Todavia no hay pagos registrados para este pedido.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Pagination
            page={paginaPedidos}
            pageSize={PAGE_SIZE}
            total={pedidosFiltrados.length}
            onPageChange={setPaginaPedidos}
            disabled={loading}
          />
        </>
      )}

      {tab === "pagos" && (
        <>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, marginBottom:16}}>
            <input
              placeholder="Buscar pago..."
              value={buscarPago}
              onChange={e => setBuscarPago(e.target.value)}
              style={{maxWidth:380, flex:1}}
            />
            <button className="primary-button" onClick={abrirModalPagoDesdeTab} type="button">
              + Registrar Pago
            </button>
          </div>

          {(() => {
            // Agrupar pagosFiltrados por pedidoId
            if (gruposPagos.length === 0) {
              return <p style={{color:"#64748b"}}>No hay pagos registrados.</p>;
            }

            return pagosPaginados.map(([pedidoId, pagosGrupo]) => {
              const ped = pedidos.find(p => Number(p.idPedido) === Number(pedidoId));
              const cliente = ped ? clienteDePedido(ped) : null;
              const totalPagado = pagosGrupo.reduce((s,p) => s + Number(p.monto), 0);
              const pendiente = ped ? Number(ped.total) - totalPagado : 0;
              const expandidoPago = pedidoExpandidoPagos === Number(pedidoId);

              return (
                <div key={pedidoId} className="pedido-card" style={{marginBottom:12}}>
                  <div className="pedido-header" onClick={() => setPedidoExpandidoPagos(expandidoPago ? null : Number(pedidoId))}>
                    <div className="pedido-header-left">
                      <span className="pedido-num">{pedidoId}</span>
                      <div>
                        <p className="pedido-cliente">{cliente ? nombreCliente(cliente) : `Cliente ${ped?.clienteId || "—"}`}</p>
                      </div>
                    </div>
                    <div className="pedido-header-right">
                      <strong>{money(totalPagado)} pagado</strong>
                      <span className="pedido-chevron">{expandidoPago ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {expandidoPago && (
                    <div className="pedido-detalle">
                      <div className="pedido-info-grid" style={{marginBottom:16}}>
                        {ped && <>
                          <div><span>Pago dividido</span><strong>{ped.pagoDividido ? "Sí" : "No"}</strong></div>
                          <div><span>Total pagado</span><strong style={{color:"#16a34a"}}>{money(totalPagado)}</strong></div>
                          <div><span>Pendiente</span><strong style={{color: pendiente > 0 ? "#c2410c" : "#000000"}}>{money(pendiente)}</strong></div>
                        </>}
                      </div>

                      <p style={{fontWeight:700, fontSize:14, margin:"0 0 8px"}}>Pagos registrados</p>
                      <div className="inv-table-wrap">
                        <table className="inv-table">
                          <thead>
                            <tr>
                              <th>Fecha</th><th>Hora</th><th>Forma</th><th>Concepto</th><th>Monto</th><th>Recibio</th><th>Referencia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagosGrupo.map((pago, i) => (
                              <tr key={pago.idPago || i}>
                                <td>{pago.fecha ? new Date(pago.fecha).toLocaleDateString("es-MX") : "—"}</td>
                                <td>{pago.horaPago ? pago.horaPago.slice(0,5) : "—"}</td>
                                <td>{pago.formaPago}</td>
                                <td>{pago.conceptoPago}</td>
                                <td>{money(pago.monto)}</td>
                                <td>{nombreEmpleado(pago.empleadoIdEmpleado || pago.createdBy)}</td>
                                <td>{pago.referencia && pago.referencia !== "." ? pago.referencia : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}

          <Pagination
            page={paginaPagos}
            pageSize={PAGE_SIZE}
            total={gruposPagos.length}
            onPageChange={setPaginaPagos}
            disabled={loading}
          />
        </>
      )}

      {/* Modal error */}
      {modalError && (
        <div className="modal-error-overlay" onClick={() => setModalError("")}>
          <div className="modal-error-card" onClick={e => e.stopPropagation()}>
            <p className="modal-error-icon">⚠</p>
            <p className="modal-error-msg">{modalError}</p>
            <button className="primary-button" onClick={() => setModalError("")}>Entendido</button>
          </div>
        </div>
      )}

      {pedidoCancelar && (
        <div className="modal-overlay" onClick={() => {
          setPedidoCancelar(null);
          setMotivoCancelacion("");
        }}>
          <div className="modal-card confirm-delivery-modal" onClick={e => e.stopPropagation()}>
            <h2>Cancelar pedido</h2>
            <p>
              Escribe el motivo por el que se cancelara el pedido{" "}
              <strong>#{pedidoCancelar.idPedido}</strong>.
            </p>
            <label className="pos-field cancel-reason-field">
              <span>Motivo de cancelacion</span>
              <textarea
                autoFocus
                rows={4}
                value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setPedidoCancelar(null);
                  setMotivoCancelacion("");
                }}
              >
                Cancelar
              </button>
              <button className="primary-button" type="button" onClick={confirmarCancelacion}>
                Confirmar cancelacion
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmarEntregaPendiente && (
        <div className="modal-overlay" onClick={() => setConfirmarEntregaPendiente(null)}>
          <div className="modal-card confirm-delivery-modal" onClick={e => e.stopPropagation()}>
            <h2>Entregar con saldo pendiente</h2>
            <p>
              Este pedido tiene un saldo pendiente de{" "}
              <strong>{money(saldoPendientePedido(confirmarEntregaPendiente))}</strong>.
              Solo los pedidos a credito o intercambio pueden entregarse con saldo pendiente.
              Confirma si deseas marcarlo como entregado de todos modos.
            </p>
            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setConfirmarEntregaPendiente(null)}
              >
                Cancelar
              </button>
              <button className="primary-button" type="button" onClick={confirmarEntregaConSaldo}>
                Confirmar entrega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pago */}
      {modalPago && (
        <div className="modal-overlay" onClick={() => setModalPago(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>Registrar Pago</h2>

            {/* Buscador de pedido */}
            <label className="pos-field search-field autocomplete-field" style={{marginBottom:16}}>
              <input
                type="search"
                placeholder="Buscar por cliente o numero de pedido..."
                value={buscarPedidoModal}
                onChange={e => {
                  const v = e.target.value;
                  setBuscarPedidoModal(v);
                  setPedidoSeleccionado(null);
                  setFormPago(f => ({ ...f, pedidoId: "", formaPago: "Efectivo" }));
                  const q = v.trim().toLowerCase();
                  if (!q) { setPedidoSugerencias([]); return; }
                  const sugs = pedidos.filter(p => {
                    const c = clienteDePedido(p);
                    const nombre = c ? nombreCliente(c).toLowerCase() : "";
                    return nombre.includes(q) || String(p.idPedido).includes(q);
                  }).slice(0, 6);
                  setPedidoSugerencias(sugs);
                }}
                onBlur={() => setTimeout(() => setPedidoSugerencias([]), 150)}
              />
              {pedidoSugerencias.length > 0 && (
                <div className="client-suggestions" role="listbox">
                  {pedidoSugerencias.map(p => {
                    const c = clienteDePedido(p);
                    return (
                      <button
                        key={p.idPedido}
                        type="button"
                        role="option"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setPedidoSeleccionado(p);
                          setBuscarPedidoModal(`${p.idPedido} — ${c ? nombreCliente(c) : `Cliente ${p.clienteId}`}`);
                          setFormPago(f => ({
                            ...f,
                            pedidoId: String(p.idPedido),
                            formaPago: formaPagoInicial(p),
                            conceptoPago: conceptoPagoInicial(p)
                          }));
                          setPedidoSugerencias([]);
                        }}
                      >
                        <strong>{p.idPedido} — {c ? nombreCliente(c) : `Cliente ${p.clienteId}`}</strong>
                        <span>{p.estado} · {money(p.total)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </label>

            {pedidoSeleccionado && (() => {
              const pagosDelPed = (todosLosPagos || []).filter(
                p => Number(p.pedidoId) === Number(pedidoSeleccionado.idPedido)
              );
              const totalPagado = pagosDelPed.reduce((s, p) => s + Number(p.monto), 0);
              const pendiente = Number(pedidoSeleccionado.total) - totalPagado;
              return (
                <p style={{color:"#64748b", fontSize:14, margin:"0 0 12px"}}>
                  Total: <strong>{money(pedidoSeleccionado.total)}</strong>
                  {" · "}
                  Pagado: <strong style={{color:"#16a34a"}}>{money(totalPagado)}</strong>
                  {" · "}
                  Pendiente: <strong style={{color: pendiente > 0 ? "#c2410c" : "#16a34a"}}>{money(pendiente)}</strong>
                </p>
              );
            })()}

            <label className="pos-field floating money-field">
              <span>Monto</span>
              <input
                inputMode="decimal"
                type="text"
                disabled={montoPagoBloqueado()}
                value={montoPagoActual()}
                onChange={e => actualizarMontoPago(e.target.value)}
              />
            </label>

            <label className="pos-field floating">
              <span>Forma de Pago</span>
              <select
                value={formPago.formaPago}
                disabled={pedidoSeleccionado?.formaPago === "Intercambio"}
                onChange={e => setFormPago(f => ({ ...f, formaPago: e.target.value }))}
              >
                {pedidoSeleccionado?.formaPago === "Intercambio" ? (
                  <option>Intercambio</option>
                ) : (
                  <>
                    <option>Efectivo</option>
                    <option>Transferencia</option>
                  </>
                )}
              </select>
            </label>
            <label className="pos-field floating">
              <span>Concepto</span>
              <select
                value={formPago.conceptoPago}
                disabled={pedidoSeleccionado?.formaPago === "Intercambio"}
                onChange={e => setFormPago(f => ({ ...f, conceptoPago: e.target.value }))}
              >
                {opcionesConceptoPago(pedidoSeleccionado).map(opcion => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="pos-field floating">
              <span>Referencia</span>
              <input type="text" value={formPago.referencia} onChange={e => setFormPago(f => ({ ...f, referencia: e.target.value }))} />
            </label>

            <div style={{display:"flex", justifyContent:"flex-end", gap:12, marginTop:20}}>
              <button className="ghost-button" type="button" onClick={() => setModalPago(null)}>Cancelar</button>
              <button className="primary-button" type="button" disabled={saving} onClick={guardarPago}>
                {saving ? "Guardando..." : "Guardar Pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}









