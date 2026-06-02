import { useEffect, useMemo, useState } from "react";
import { listarPedidos, actualizarPedido, listarDetallesPedido } from "../api/pedidoApi.js";
import { listarPagosPorPedido, listarTodosPagos, crearPago } from "../api/pagoApi.js";
// import listarServicios además de listarClientes
import { listarClientes, listarServicios } from "../api/catalogApi.js";
import { useAuth } from "../auth/AuthContext.jsx";

export function PedidosPage() {
  const { session } = useAuth();

  const [tab, setTab] = useState("pedidos");
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
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
    conceptoPago: "Pago_parcial", fecha: "", horaPago: "",
    pagoDividido: false, pedidoId: ""
  });
  const [buscarPedido, setBuscarPedido] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [buscarPago, setBuscarPago] = useState("");
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [pedidoExpandidoPagos, setPedidoExpandidoPagos] = useState(null);
  
  // Nuevo: estados para modal pago con buscador
  const [buscarPedidoModal, setBuscarPedidoModal] = useState("");
  const [pedidoSugerencias, setPedidoSugerencias] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

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
  function nombreCliente(c) {
    return [c?.nombre, c?.apellidoPaterno, c?.apellidoMaterno].filter(Boolean).join(" ");
  }
  function clienteDePedido(p) {
    return clientes.find(c => Number(c.idCliente) === Number(p.clienteId));
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
        const [ps, cs, pagos, svcs] = await Promise.all([listarPedidos(), listarClientes(), listarTodosPagos(), listarServicios()]);
        if (!active) return;
        setPedidos((ps || []).slice().sort((a, b) => Number(b.idPedido) - Number(a.idPedido)));
        setClientes(cs || []);
        setTodosLosPagos(pagos || []);
        setServicios(svcs || []);
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
      const cliente = clienteDePedido(p);
      const nombre = cliente ? nombreCliente(cliente).toLowerCase() : "";
      const matchBuscar = !q || nombre.includes(q) || String(p.idPedido).includes(q);
      const matchEstado = !filtroEstado || p.estado === filtroEstado;
      return matchBuscar && matchEstado;
    });
  }, [pedidos, buscarPedido, filtroEstado, clientes]);

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
      monto: "", formaPago: "Efectivo", referencia: "", conceptoPago: "Pago_parcial",
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
    setFormPago({ monto: "", formaPago: "Efectivo", referencia: "", conceptoPago: "Pago_parcial", fecha, horaPago, pagoDividido: false, pedidoId: "" });
    // reset buscador
    setBuscarPedidoModal("");
    setPedidoSugerencias([]);
    setPedidoSeleccionado(null);
    setModalPago({ pedido: null, desdePedido: false });
  }

  async function guardarPago() {
    const pedidoId = Number(formPago.pedidoId);
    if (!pedidoId) { mostrarError("Selecciona un pedido."); return; }
    if (!formPago.monto || Number(formPago.monto) <= 0) { mostrarError("Ingresa un monto válido."); return; }

    // usar todosLosPagos para calcular lo ya pagado (puede no estar en pagosPorPedido)
    const pagosActuales = (todosLosPagos || []).filter(p => Number(p.pedidoId) === Number(pedidoId));
    const totalPagado = pagosActuales.reduce((s, p) => s + Number(p.monto), 0);

    const ped = pedidos.find(p => Number(p.idPedido) === pedidoId);
    const pendiente = ped ? Number(ped.total) - totalPagado : 0;
    if (Number(formPago.monto) > pendiente) { mostrarError(`El monto excede el pendiente (${money(pendiente)}).`); return; }

    setSaving(true);
    try {
      await crearPago({
        monto: Number(formPago.monto).toFixed(2),
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

      const nuevoTotal = (nuevosPagos || []).reduce((s,p) => s + Number(p.monto), 0);
      if (ped && nuevoTotal >= Number(ped.total)) {
        await actualizarPedido(pedidoId, { ...ped, estado: "Entregado", updatedBy: session.empleadoId });
        const ps = await listarPedidos();
        setPedidos((ps || []).slice().sort((a,b) => Number(b.idPedido) - Number(a.idPedido)));
      }

      setModalPago(null);
      mostrarSuccess("Pago registrado correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function cambiarEstado(pedidoObj, nuevoEstado) {
    setCambiandoEstado(pedidoObj.idPedido);
    try {
      await actualizarPedido(pedidoObj.idPedido, { ...pedidoObj, estado: nuevoEstado, updatedBy: session.empleadoId });
      const ps = await listarPedidos();
      setPedidos((ps || []).slice().sort((a,b) => Number(b.idPedido) - Number(a.idPedido)));
      mostrarSuccess("Estado actualizado.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setCambiandoEstado(null);
    }
  }

  const pagosFiltrados = useMemo(() => {
    const q = (buscarPago || "").trim().toLowerCase();
    return (todosLosPagos || []).filter(p => {
      return !q || String(p.pedidoId).includes(q) || (p.formaPago || "").toLowerCase().includes(q) || (p.conceptoPago || "").toLowerCase().includes(q);
    });
  }, [todosLosPagos, buscarPago]);

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <h1>Pedidos</h1>
        </div>
      </div>

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
              <option>Borrador</option>
              <option>En proceso</option>
              <option>Terminado</option>
              <option>Entregado</option>
            </select>
          </div>

          <div className="pedidos-lista">
            {pedidosFiltrados.map(pedido => {
              const cliente = clienteDePedido(pedido);
              const expandido = pedidoExpandido === pedido.idPedido;
              const pagos = pagosPorPedido[pedido.idPedido] || [];
              const totalPagado = pagos.reduce((s, p) => s + Number(p.monto), 0);
              const pendiente = Number(pedido.total) - totalPagado;

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
                      <strong style={{fontSize:16}}>{money(pedido.total)}</strong>
                      <select
                         value={pedido.estado}
                         disabled={cambiandoEstado === pedido.idPedido}
                         onChange={e => cambiarEstado(pedido, e.target.value)}
                         style={{
                           padding: "6px 12px",
                           borderRadius: 20,
                           border: "0",
                           fontWeight: 700,
                           fontSize: 13,
                           background:
                             pedido.estado === "Borrador" ? "#f4f4f4" :
                             pedido.estado === "En proceso" ? "#eff6ff" :
                             pedido.estado === "Terminado" ? "#fff7ed" :
                             pedido.estado === "Entregado" ? "#f0fff4" : "#f4f4f4",
                           color:
                             pedido.estado === "Borrador" ? "#64748b" :
                             pedido.estado === "En proceso" ? "#1d4ed8" :
                             pedido.estado === "Terminado" ? "#c2410c" :
                             pedido.estado === "Entregado" ? "#216e39" : "#64748b"
                         }}
                       >
                         <option>Borrador</option>
                         <option>En proceso</option>
                         <option>Terminado</option>
                         <option>Entregado</option>
                       </select>
                       <span className="pedido-chevron">{expandido ? "▲" : "▼"}</span>
                     </div>
                  </div>

                  {expandido && (
                    <div className="pedido-detalle">
                      {/* Solo mostrar la fecha de entrega y la tabla de servicios */}
                      <p style={{fontSize:14, color:"#64748b", margin:"0 0 12px"}}>
                        Entrega: <strong>{pedido.fechaEntrega ? new Date(pedido.fechaEntrega).toLocaleDateString("es-MX") : "—"}</strong>
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
            const grupos = {};
            (pagosFiltrados || []).forEach(pago => {
              const id = String(pago.pedidoId);
              if (!grupos[id]) grupos[id] = [];
              grupos[id].push(pago);
            });

            const entradas = Object.entries(grupos);
            if (entradas.length === 0) {
              return <p style={{color:"#64748b"}}>No hay pagos registrados.</p>;
            }

            return entradas.map(([pedidoId, pagosGrupo]) => {
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
                              <th>Fecha</th><th>Hora</th><th>Forma</th><th>Concepto</th><th>Monto</th><th>Referencia</th>
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
                  setFormPago(f => ({ ...f, pedidoId: "" }));
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
                          setFormPago(f => ({ ...f, pedidoId: String(p.idPedido) }));
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

            <label className="pos-field floating">
              <span>Monto</span>
              <input type="number" min="0" step="0.01" value={formPago.monto} onChange={e => setFormPago(f => ({ ...f, monto: e.target.value }))} />
            </label>

            <label className="pos-field floating">
              <span>Forma de Pago</span>
              <select value={formPago.formaPago} onChange={e => setFormPago(f => ({ ...f, formaPago: e.target.value }))}>
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Tarjeta</option>
                <option>Credito</option>
              </select>
            </label>

            <label className="pos-field floating">
              <span>Tipo de Cobro</span>
              <select value={String(formPago.pagoDividido)} onChange={e => setFormPago(f => ({ ...f, pagoDividido: e.target.value === "true" }))}>
                <option value="false">Pago único</option>
                <option value="true">Pago dividido</option>
              </select>
            </label>

            <label className="pos-field floating">
              <span>Concepto</span>
              <select value={formPago.conceptoPago} onChange={e => setFormPago(f => ({ ...f, conceptoPago: e.target.value }))}>
                <option value="Pago_parcial">Pago parcial</option>
                <option value="Pago_total">Pago total</option>
                <option value="Anticipo">Anticipo</option>
              </select>
            </label>

            <label className="pos-field floating">
              <span>Referencia (opcional)</span>
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