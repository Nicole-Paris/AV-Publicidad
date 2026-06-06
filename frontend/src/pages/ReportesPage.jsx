import { useEffect, useMemo, useState } from "react";
import { listarClientes, listarServicios } from "../api/catalogApi.js";
import { listarInventarios, listarMateriales } from "../api/inventarioApi.js";
import { listarPagosPorPedido, listarTodosPagos } from "../api/pagoApi.js";
import { listarDetallesPedido, listarPedidos } from "../api/pedidoApi.js";
import { listarEmpleados } from "../api/empleadoApi.js";
import { useAuth } from "../auth/AuthContext.jsx";

const CURRENCY = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency"
});

function money(value) {
  return CURRENCY.format(Number(value || 0));
}

function localDate(daysToAdd = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function toDateOnly(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function inRange(value, from, to) {
  const date = toDateOnly(value);
  if (!date) return false;
  return (!from || date >= from) && (!to || date <= to);
}

function nombreCliente(cliente) {
  return [cliente?.nombre, cliente?.apellidoPaterno, cliente?.apellidoMaterno]
    .filter(Boolean)
    .join(" ");
}

export function ReportesPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [modalError, setModalError] = useState("");
  const [fechaInicio, setFechaInicio] = useState(localDate(-30));
  const [fechaFin, setFechaFin] = useState(localDate(0));
  const [pedidos, setPedidos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [inventarios, setInventarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    let active = true;

    async function cargarReportes() {
      setLoading(true);
      try {
        const [pedidosData, pagosData, clientesData, serviciosData, materialesData, inventariosData, empleadosData] = await Promise.all([
          listarPedidos(),
          listarTodosPagos(),
          listarClientes(),
          listarServicios(),
          listarMateriales(),
          listarInventarios(),
          listarEmpleados()
        ]);

        if (!active) return;

        const pedidosArray = Array.isArray(pedidosData) ? pedidosData : [];
        setPedidos(pedidosArray);
        setPagos(Array.isArray(pagosData) ? pagosData : []);
        setClientes(Array.isArray(clientesData) ? clientesData : []);
        setServicios(Array.isArray(serviciosData) ? serviciosData : []);
        setMateriales(Array.isArray(materialesData) ? materialesData : []);
        setInventarios(Array.isArray(inventariosData) ? inventariosData : []);
        setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);

        const detallesPorPedido = await Promise.all(
          pedidosArray.map(async (pedido) => {
            try {
              const data = await listarDetallesPedido(pedido.idPedido);
              return Array.isArray(data) ? data.filter(detalle => Number(detalle.pedidoId) === Number(pedido.idPedido)) : [];
            } catch {
              return [];
            }
          })
        );

        if (active) {
          setDetalles(detallesPorPedido.flat());
        }
      } catch (err) {
        if (active) setModalError(err.message || String(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    cargarReportes();
    return () => {
      active = false;
    };
  }, []);

  const sucursalActivaId = session?.sucursalIdSucursal || session?.sucursalId;

  function empleadoPerteneceSucursal(empleadoId) {
    if (!sucursalActivaId) {
      return true;
    }
    const empleado = empleados.find((item) => Number(item.idEmpleado) === Number(empleadoId));
    return Number(empleado?.sucursalIdSucursal) === Number(sucursalActivaId);
  }

  function registroCreadoEnSucursal(registro) {
    if (!sucursalActivaId) {
      return true;
    }
    return empleadoPerteneceSucursal(registro.createdBy);
  }

  const pedidosSucursal = useMemo(() => (
    pedidos.filter(pedido => !sucursalActivaId || Number(pedido.sucursalId) === Number(sucursalActivaId))
  ), [pedidos, sucursalActivaId]);

  const pagosSucursal = useMemo(() => {
    const pedidosIds = new Set(pedidosSucursal.map(pedido => Number(pedido.idPedido)));
    return pagos.filter(pago => pedidosIds.has(Number(pago.pedidoId)));
  }, [pagos, pedidosSucursal]);

  const inventariosSucursal = useMemo(() => (
    inventarios.filter(inventario => !sucursalActivaId || Number(inventario.sucursalId) === Number(sucursalActivaId))
  ), [inventarios, sucursalActivaId]);

  const clientesSucursal = useMemo(() => (
    clientes.filter(registroCreadoEnSucursal)
  ), [clientes, empleados, sucursalActivaId]);

  const serviciosSucursal = useMemo(() => (
    servicios.filter(registroCreadoEnSucursal)
  ), [servicios, empleados, sucursalActivaId]);

  const pedidosPeriodo = useMemo(
    () => pedidosSucursal.filter(pedido => inRange(pedido.fechaPedido, fechaInicio, fechaFin)),
    [pedidosSucursal, fechaInicio, fechaFin]
  );

  const pagosPeriodo = useMemo(
    () => pagosSucursal.filter(pago => inRange(pago.fecha || pago.createdAt, fechaInicio, fechaFin)),
    [pagosSucursal, fechaInicio, fechaFin]
  );

  const pagosPorPedido = useMemo(() => {
    const map = new Map();
    pagos.forEach((pago) => {
      const pedidoId = Number(pago.pedidoId);
      map.set(pedidoId, (map.get(pedidoId) || 0) + Number(pago.monto || 0));
    });
    return map;
  }, [pagos]);

  const ventasPeriodo = pedidosPeriodo.reduce((total, pedido) => total + Number(pedido.total || 0), 0);
  const cobradoPeriodo = pagosPeriodo.reduce((total, pago) => total + Number(pago.monto || 0), 0);
  const pendientePeriodo = pedidosPeriodo.reduce((total, pedido) => {
    const pendiente = Math.max(0, Number(pedido.total || 0) - Number(pagosPorPedido.get(Number(pedido.idPedido)) || 0));
    return total + pendiente;
  }, 0);
  const ticketPromedio = pedidosPeriodo.length ? ventasPeriodo / pedidosPeriodo.length : 0;

  const pedidosPorEstado = useMemo(() => {
    const estados = ["Borrador", "Pendiente", "En proceso", "Terminado", "Entregado", "Cancelado"];
    return estados.map((estado) => ({
      label: estado,
      value: pedidosPeriodo.filter(pedido => pedido.estado === estado).length
    }));
  }, [pedidosPeriodo]);

  const pagosPorForma = useMemo(() => {
    const formas = ["Efectivo", "Transferencia", "Intercambio"];
    return formas.map((forma) => ({
      label: forma,
      value: pagosPeriodo
        .filter(pago => pago.formaPago === forma)
        .reduce((total, pago) => total + Number(pago.monto || 0), 0)
    })).filter(item => item.value > 0);
  }, [pagosPeriodo]);

  const topClientes = useMemo(() => {
    const map = new Map();
    pedidosPeriodo.forEach((pedido) => {
      const clienteId = Number(pedido.clienteId);
      const current = map.get(clienteId) || { clienteId, pedidos: 0, total: 0 };
      current.pedidos += 1;
      current.total += Number(pedido.total || 0);
      map.set(clienteId, current);
    });

    return Array.from(map.values())
      .map(item => ({
        ...item,
        nombre: nombreCliente(clientesSucursal.find(cliente => Number(cliente.idCliente) === Number(item.clienteId))) || `Cliente ${item.clienteId}`
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [pedidosPeriodo, clientesSucursal]);

  const topServicios = useMemo(() => {
    const pedidosIds = new Set(pedidosPeriodo.map(pedido => Number(pedido.idPedido)));
    const map = new Map();
    detalles
      .filter(detalle => pedidosIds.has(Number(detalle.pedidoId)))
      .forEach((detalle) => {
        const servicioId = Number(detalle.servicioId);
        const current = map.get(servicioId) || { servicioId, cantidad: 0, total: 0 };
        current.cantidad += Number(detalle.cantidad || 0);
        current.total += Number(detalle.subtotal || Number(detalle.cantidad || 0) * Number(detalle.precioUnitario || 0));
        map.set(servicioId, current);
      });

    return Array.from(map.values())
      .map(item => ({
        ...item,
        nombre: serviciosSucursal.find(servicio => Number(servicio.idServicio) === Number(item.servicioId))?.nombre || `Servicio ${item.servicioId}`
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [detalles, pedidosPeriodo, serviciosSucursal]);

  const alertasStock = useMemo(() => {
    return inventariosSucursal
      .filter(inventario => Number(inventario.stockActual || 0) <= Number(inventario.stockMinimo || 0))
      .map((inventario) => ({
        ...inventario,
        material: materiales.find(material => Number(material.idMaterial) === Number(inventario.materialId))?.nombre || `Material ${inventario.materialId}`
      }))
      .sort((a, b) => Number(a.stockActual || 0) - Number(b.stockActual || 0))
      .slice(0, 6);
  }, [inventariosSucursal, materiales]);

  const pagosRecientes = useMemo(() => {
    return [...pagosPeriodo]
      .sort((a, b) => new Date(`${b.fecha || ""}T${b.horaPago || "00:00:00"}`) - new Date(`${a.fecha || ""}T${a.horaPago || "00:00:00"}`))
      .slice(0, 6);
  }, [pagosPeriodo]);

  const maxEstado = Math.max(...pedidosPorEstado.map(item => item.value), 1);
  const maxForma = Math.max(...pagosPorForma.map(item => item.value), 1);

  return (
    <section className="page-stack reports-page">
      <div className="page-header">
        <div>
          <h1>Reportes</h1>
          <p className="page-subtitle">Resumen operativo de ventas, pagos, pedidos e inventario.</p>
        </div>
      </div>

      <div className="report-filters">
        <label>
          <span>Desde</span>
          <input type="date" value={fechaInicio} onChange={event => setFechaInicio(event.target.value)} />
        </label>
        <label>
          <span>Hasta</span>
          <input type="date" value={fechaFin} onChange={event => setFechaFin(event.target.value)} />
        </label>
      </div>

      <div className="report-kpis">
        <article className="report-kpi"><span>Ventas</span><strong>{money(ventasPeriodo)}</strong></article>
        <article className="report-kpi"><span>Cobrado</span><strong>{money(cobradoPeriodo)}</strong></article>
        <article className="report-kpi warn"><span>Por cobrar</span><strong>{money(pendientePeriodo)}</strong></article>
        <article className="report-kpi"><span>Pedidos</span><strong>{pedidosPeriodo.length}</strong></article>
        <article className="report-kpi"><span>Ticket promedio</span><strong>{money(ticketPromedio)}</strong></article>
      </div>

      <div className="report-grid">
        <section className="report-panel">
          <h2>Pedidos por estado</h2>
          <div className="report-bars">
            {pedidosPorEstado.map((item) => (
              <div className="report-bar-row" key={item.label}>
                <span>{item.label}</span>
                <div><i style={{ width: `${(item.value / maxEstado) * 100}%` }} /></div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="report-panel">
          <h2>Pagos por forma</h2>
          {pagosPorForma.length > 0 ? (
            <div className="report-bars">
              {pagosPorForma.map((item) => (
                <div className="report-bar-row" key={item.label}>
                  <span>{item.label}</span>
                  <div><i style={{ width: `${(item.value / maxForma) * 100}%` }} /></div>
                  <strong>{money(item.value)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="report-empty">Sin pagos en el periodo.</p>
          )}
        </section>
      </div>

      <div className="report-grid">
        <section className="report-panel">
          <h2>Clientes con mas ventas</h2>
          <table className="report-table">
            <thead><tr><th>Cliente</th><th>Pedidos</th><th>Total</th></tr></thead>
            <tbody>
              {topClientes.map(cliente => (
                <tr key={cliente.clienteId}><td>{cliente.nombre}</td><td>{cliente.pedidos}</td><td>{money(cliente.total)}</td></tr>
              ))}
              {topClientes.length === 0 && <tr><td colSpan={3}>Sin ventas en el periodo.</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="report-panel">
          <h2>Servicios mas vendidos</h2>
          <table className="report-table">
            <thead><tr><th>Servicio</th><th>Cantidad</th><th>Total</th></tr></thead>
            <tbody>
              {topServicios.map(servicio => (
                <tr key={servicio.servicioId}><td>{servicio.nombre}</td><td>{servicio.cantidad}</td><td>{money(servicio.total)}</td></tr>
              ))}
              {topServicios.length === 0 && <tr><td colSpan={3}>Sin servicios en el periodo.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>

      <div className="report-grid">
        <section className="report-panel">
          <h2>Alertas de inventario</h2>
          <table className="report-table">
            <thead><tr><th>Material</th><th>Stock</th><th>Minimo</th></tr></thead>
            <tbody>
              {alertasStock.map(alerta => (
                <tr key={alerta.idInventario || `${alerta.materialId}-${alerta.sucursalId}`}>
                  <td>{alerta.material}</td>
                  <td>{Number(alerta.stockActual || 0)}</td>
                  <td>{Number(alerta.stockMinimo || 0)}</td>
                </tr>
              ))}
              {alertasStock.length === 0 && <tr><td colSpan={3}>Inventario sin alertas.</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="report-panel">
          <h2>Pagos recientes</h2>
          <table className="report-table">
            <thead><tr><th>Pedido</th><th>Forma</th><th>Monto</th></tr></thead>
            <tbody>
              {pagosRecientes.map(pago => (
                <tr key={pago.idPago || `${pago.pedidoId}-${pago.referencia}`}>
                  <td>#{pago.pedidoId}</td>
                  <td>{pago.formaPago}</td>
                  <td>{money(pago.monto)}</td>
                </tr>
              ))}
              {pagosRecientes.length === 0 && <tr><td colSpan={3}>Sin pagos recientes.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>

      {loading && <div className="pos-alert success">Cargando reportes...</div>}

      {modalError && (
        <div className="modal-error-overlay" onClick={() => setModalError("")}>
          <div className="modal-error-card" onClick={event => event.stopPropagation()}>
            <p className="modal-error-icon">!</p>
            <p className="modal-error-msg">{modalError}</p>
            <button className="primary-button" onClick={() => setModalError("")} type="button">
              Entendido
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
