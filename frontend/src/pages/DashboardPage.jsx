import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listarClientes, listarServicios } from "../api/catalogApi.js";
import { listarCortesCaja } from "../api/corteCajaApi.js";
import { listarInventarios, listarMateriales } from "../api/inventarioApi.js";
import { listarTodosPagos } from "../api/pagoApi.js";
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

function today() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function dateOnly(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function nombreCliente(cliente) {
  return [cliente?.nombre, cliente?.apellidoPaterno, cliente?.apellidoMaterno]
    .filter(Boolean)
    .join(" ");
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("es-MX", {
    month: "short",
    year: "2-digit"
  });
}

const PIE_COLORS = ["#fb5a35", "#050718", "#1677c7", "#16a34a", "#c2410c"];

function buildPieGradient(items) {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  if (!total) return "#edf2f7";

  let cursor = 0;
  return `conic-gradient(${items.map((item, index) => {
    const start = cursor;
    const end = cursor + (Number(item.value || 0) / total) * 100;
    cursor = end;
    return `${item.color || PIE_COLORS[index % PIE_COLORS.length]} ${start}% ${end}%`;
  }).join(", ")})`;
}

export function DashboardPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [modalError, setModalError] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [inventarios, setInventarios] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cortes, setCortes] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    let active = true;

    async function cargarDashboard() {
      setLoading(true);
      try {
        const [pedidosData, pagosData, clientesData, inventariosData, materialesData, cortesData, serviciosData, empleadosData] = await Promise.all([
          listarPedidos(),
          listarTodosPagos(),
          listarClientes(),
          listarInventarios(),
          listarMateriales(),
          listarCortesCaja(),
          listarServicios(),
          listarEmpleados()
        ]);

        if (!active) return;

        const pedidosArray = Array.isArray(pedidosData) ? pedidosData : [];
        setPedidos(pedidosArray);
        setPagos(Array.isArray(pagosData) ? pagosData : []);
        setClientes(Array.isArray(clientesData) ? clientesData : []);
        setInventarios(Array.isArray(inventariosData) ? inventariosData : []);
        setMateriales(Array.isArray(materialesData) ? materialesData : []);
        setCortes(Array.isArray(cortesData) ? cortesData : []);
        setServicios(Array.isArray(serviciosData) ? serviciosData : []);
        setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);

        const detallesPorPedido = await Promise.all(
          pedidosArray.map(async (pedido) => {
            try {
              const data = await listarDetallesPedido(pedido.idPedido);
              return Array.isArray(data)
                ? data.filter(detalle => Number(detalle.pedidoId) === Number(pedido.idPedido))
                : [];
            } catch {
              return [];
            }
          })
        );

        if (active) setDetalles(detallesPorPedido.flat());
      } catch (err) {
        if (active) setModalError(err.message || String(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    cargarDashboard();
    return () => {
      active = false;
    };
  }, []);

  const hoy = today();
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

  const cortesSucursal = useMemo(() => (
    cortes.filter(corte => empleadoPerteneceSucursal(corte.empleadoId))
  ), [cortes, empleados, sucursalActivaId]);

  const clientesSucursal = useMemo(() => (
    clientes.filter(registroCreadoEnSucursal)
  ), [clientes, empleados, sucursalActivaId]);

  const pagosDelDia = useMemo(() => {
    return pagosSucursal
      .filter(pago => dateOnly(pago.fecha || pago.createdAt) === hoy)
      .reduce((total, pago) => total + Number(pago.monto || 0), 0);
  }, [pagosSucursal, hoy]);

  const pedidosPendientes = pedidosSucursal.filter(pedido =>
    ["Pendiente", "En proceso", "Terminado"].includes(pedido.estado)
  );

  const stockBajo = inventariosSucursal.filter(inventario =>
    Number(inventario.stockActual || 0) <= Number(inventario.stockMinimo || 0)
  );

  const cortesAbiertos = cortesSucursal.filter(corte => !corte.horaFin && !corte.deletedAt);

  const ventasHoy = pedidosSucursal
    .filter(pedido => dateOnly(pedido.fechaPedido) === hoy)
    .reduce((total, pedido) => total + Number(pedido.total || 0), 0);

  const pedidosRecientes = [...pedidosSucursal]
    .sort((a, b) => Number(b.idPedido) - Number(a.idPedido))
    .slice(0, 5);

  const alertasInventario = stockBajo.slice(0, 5).map(inventario => ({
    ...inventario,
    material: materiales.find(material => Number(material.idMaterial) === Number(inventario.materialId))?.nombre || `Material ${inventario.materialId}`
  }));

  const clientesFrecuentes = clientesSucursal.filter(cliente => cliente.tipo === "Frecuente").length;

  const pedidosPorEstado = [
    "Borrador",
    "Pendiente",
    "En proceso",
    "Terminado",
    "Entregado",
    "Cancelado"
  ].map((estado) => ({
    label: estado,
    value: pedidosSucursal.filter(pedido => pedido.estado === estado).length
  }));

  const ventasMensuales = useMemo(() => {
    const base = new Date();
    base.setDate(1);

    const months = [];
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(base);
      date.setMonth(base.getMonth() - index);
      const key = monthKey(date);
      months.push({ key, label: monthLabel(key), value: 0 });
    }

    const map = new Map(months.map(item => [item.key, item]));
    pedidosSucursal.forEach((pedido) => {
      const date = new Date(pedido.fechaPedido);
      if (Number.isNaN(date.getTime())) return;

      const item = map.get(monthKey(date));
      if (item) item.value += Number(pedido.total || 0);
    });

    return months;
  }, [pedidosSucursal]);

  const serviciosMasPedidos = useMemo(() => {
    const pedidosIds = new Set(pedidosSucursal.map(pedido => Number(pedido.idPedido)));
    const map = new Map();
    detalles.filter(detalle => pedidosIds.has(Number(detalle.pedidoId))).forEach((detalle) => {
      const servicioId = Number(detalle.servicioId);
      if (!servicioId) return;

      const current = map.get(servicioId) || { servicioId, cantidad: 0, total: 0 };
      current.cantidad += Number(detalle.cantidad || 0);
      current.total += Number(detalle.subtotal || Number(detalle.cantidad || 0) * Number(detalle.precioUnitario || 0));
      map.set(servicioId, current);
    });

    return Array.from(map.values())
      .map(item => ({
        ...item,
        nombre: servicios.find(servicio => Number(servicio.idServicio) === Number(item.servicioId))?.nombre || `Servicio ${item.servicioId}`
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [detalles, servicios, pedidosSucursal]);

  const estadoInventario = [
    { label: "Stock correcto", value: Math.max(0, inventariosSucursal.length - stockBajo.length) },
    { label: "Stock bajo", value: stockBajo.length }
  ];

  const serviciosPie = serviciosMasPedidos.map((item, index) => ({
    label: item.nombre,
    value: item.cantidad,
    color: PIE_COLORS[index % PIE_COLORS.length]
  }));

  const inventarioPie = estadoInventario.map((item, index) => ({
    ...item,
    color: index === 0 ? "#16a34a" : "#c2410c"
  }));

  const maxPedidosEstado = Math.max(...pedidosPorEstado.map(item => item.value), 1);
  const maxVentasMensuales = Math.max(...ventasMensuales.map(item => item.value), 1);

  const metrics = [
    { label: "Pedidos activos", value: pedidosPendientes.length, note: "Pendiente, en proceso o terminado" },
    { label: "Pagos del dia", value: money(pagosDelDia), note: "Cobros registrados hoy" },
    { label: "Ventas del dia", value: money(ventasHoy), note: "Pedidos creados hoy" },
    { label: "Stock bajo", value: stockBajo.length, note: "Materiales en reorden", tone: stockBajo.length ? "warn" : "" },
    { label: "Cortes abiertos", value: cortesAbiertos.length, note: "Cajas sin cerrar", tone: cortesAbiertos.length ? "warn" : "" },
    { label: "Clientes frecuentes", value: clientesFrecuentes, note: "Clientes marcados como frecuentes" }
  ];

  function clientePedido(pedido) {
    const cliente = clientes.find(item => Number(item.idCliente) === Number(pedido.clienteId));
    return nombreCliente(cliente) || `Cliente ${pedido.clienteId}`;
  }

  return (
    <section className="page-stack dashboard-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Panel principal</span>
          <h1>Hola, {session?.nombre}</h1>
          <p className="page-subtitle">
            Resumen de {session?.sucursal || "Sucursal Centro"} para operar el dia.
          </p>
        </div>
      </div>

      <div className="dashboard-metrics">
        {metrics.map((card) => (
          <article className={`dashboard-card ${card.tone || ""}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="tab-section-header">
            <h2>Pedidos recientes</h2>
            <Link className="dashboard-link" to="/pedidos">Ver pedidos</Link>
          </div>
          <div className="dashboard-list">
            {pedidosRecientes.map((pedido) => (
              <div className="dashboard-list-item" key={pedido.idPedido}>
                <div>
                  <strong>#{pedido.idPedido} · {clientePedido(pedido)}</strong>
                  <span>{pedido.estado} · {dateOnly(pedido.fechaPedido) || "-"}</span>
                </div>
                <b>{money(pedido.total)}</b>
              </div>
            ))}
            {!loading && pedidosRecientes.length === 0 && <p className="report-empty">Sin pedidos registrados.</p>}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="tab-section-header">
            <h2>Inventario por atender</h2>
            <Link className="dashboard-link" to="/inventario">Ver inventario</Link>
          </div>
          <div className="dashboard-list">
            {alertasInventario.map((inventario) => (
              <div className="dashboard-list-item" key={inventario.idInventario || `${inventario.materialId}-${inventario.sucursalId}`}>
                <div>
                  <strong>{inventario.material}</strong>
                  <span>Minimo: {Number(inventario.stockMinimo || 0)}</span>
                </div>
                <b className="danger">{Number(inventario.stockActual || 0)}</b>
              </div>
            ))}
            {!loading && alertasInventario.length === 0 && <p className="report-empty">No hay alertas de stock.</p>}
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="tab-section-header">
            <h2>Ventas mensuales</h2>
            <Link className="dashboard-link" to="/reportes">Ver reportes</Link>
          </div>
          <div className="dashboard-chart">
            {ventasMensuales.map((item) => (
              <div className="dashboard-chart-row" key={item.key}>
                <span>{item.label}</span>
                <div>
                  <i style={{ width: `${(item.value / maxVentasMensuales) * 100}%` }} />
                </div>
                <strong>{money(item.value)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="tab-section-header">
            <h2>Servicios mas pedidos</h2>
            <Link className="dashboard-link" to="/servicios">Ver servicios</Link>
          </div>
          <div className="dashboard-pie-wrap">
            <div className="dashboard-pie" style={{ background: buildPieGradient(serviciosPie) }}>
              <span>{serviciosMasPedidos.reduce((total, item) => total + Number(item.cantidad || 0), 0)}</span>
            </div>
            <div className="dashboard-pie-legend">
              {serviciosPie.map((item) => (
                <div className="dashboard-pie-legend-item" key={item.label}>
                  <i style={{ background: item.color }} />
                  <span title={item.label}>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            {!loading && serviciosMasPedidos.length === 0 && <p className="report-empty">Sin servicios vendidos.</p>}
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="tab-section-header">
            <h2>Pedidos por estado</h2>
            <Link className="dashboard-link" to="/pedidos">Ver detalle</Link>
          </div>
          <div className="dashboard-chart">
            {pedidosPorEstado.map((item) => (
              <div className="dashboard-chart-row" key={item.label}>
                <span>{item.label}</span>
                <div>
                  <i style={{ width: `${(item.value / maxPedidosEstado) * 100}%` }} />
                </div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="tab-section-header">
            <h2>Estado del inventario</h2>
            <Link className="dashboard-link" to="/inventario">Ver inventario</Link>
          </div>
          <div className="dashboard-pie-wrap">
            <div className="dashboard-pie" style={{ background: buildPieGradient(inventarioPie) }}>
              <span>{inventariosSucursal.length}</span>
            </div>
            <div className="dashboard-pie-legend">
              {inventarioPie.map((item) => (
                <div className="dashboard-pie-legend-item" key={item.label}>
                  <i style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="dashboard-panel">
        <h2>Accesos rapidos</h2>
        <div className="dashboard-actions">
          <Link to="/punto-venta">Nuevo pedido</Link>
          <Link to="/clientes">Clientes</Link>
          <Link to="/pedidos">Registrar pago</Link>
          <Link to="/cortes-caja">Corte de caja</Link>
          <Link to="/reportes">Reportes</Link>
          <Link to="/configuracion">Configuracion</Link>
        </div>
      </section>

      {loading && <div className="pos-alert success">Cargando panel principal...</div>}

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
