import { useEffect, useMemo, useState } from "react";
import { listarClientes, listarServicios, listarSucursales } from "../api/catalogApi.js";
import { actualizarPedido, crearDetallePedido, crearPedido } from "../api/pedidoApi.js";
import { useAuth } from "../auth/AuthContext.jsx";

const IVA = 0.16;

function money(value) {
  return new Intl.NumberFormat("es-MX", {
    currency: "MXN",
    style: "currency"
  }).format(value || 0);
}

function localDateTime(daysToAdd = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function localDate(daysToAdd = 0) {
  return localDateTime(daysToAdd).slice(0, 10);
}

function nombreCliente(cliente) {
  return [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno].filter(Boolean).join(" ");
}

export function PuntoVentaPage() {
  const { session } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pedido, setPedido] = useState({
    clienteId: "",
    origen: "Presencial",
    formaPago: "Contado",
    fechaEntrega: localDate(1)
  });
  const [detalle, setDetalle] = useState({
    servicioId: "",
    cantidad: "1",
    precioUnitario: "",
    unidadDetalle: "Piezas"
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;

    async function cargarCatalogos() {
      setLoadingCatalogos(true);
      setError("");

      try {
        const [clientesData, serviciosData, sucursalesData] = await Promise.all([
          listarClientes(),
          listarServicios(),
          listarSucursales()
        ]);

        if (!active) {
          return;
        }

        setClientes(clientesData);
        setServicios(serviciosData);
        setSucursales(sucursalesData);
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoadingCatalogos(false);
        }
      }
    }

    cargarCatalogos();

    return () => {
      active = false;
    };
  }, []);

  const sucursalActiva = useMemo(() => {
    const id = session?.sucursalIdSucursal || session?.sucursalId;
    return sucursales.find((sucursal) => sucursal.idSucursal === id) || sucursales[0];
  }, [session, sucursales]);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.subtotal, 0),
    [items]
  );
  const iva = subtotal * IVA;
  const total = subtotal + iva;

  const canAdd =
    detalle.servicioId &&
    Number(detalle.cantidad) > 0 &&
    Number(detalle.precioUnitario) > 0;
  const canConfirm =
    pedido.clienteId &&
    pedido.fechaEntrega &&
    sucursalActiva?.idSucursal &&
    session?.empleadoId &&
    items.length > 0 &&
    !saving;

  function updatePedido(event) {
    const { name, value } = event.target;
    setPedido((current) => ({ ...current, [name]: value }));
  }

  function updateDetalle(event) {
    const { name, value } = event.target;
    setDetalle((current) => ({ ...current, [name]: value }));
  }

  function agregarServicio() {
    setError("");
    setSuccess("");

    if (!canAdd) {
      setError("Selecciona un servicio, cantidad y precio unitario validos.");
      return;
    }

    const servicio = servicios.find((current) => current.idServicio === Number(detalle.servicioId));
    const cantidad = Number(detalle.cantidad);
    const precioUnitario = Number(detalle.precioUnitario);

    setItems((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        servicioId: servicio.idServicio,
        nombre: servicio.nombre,
        cantidad,
        precioUnitario,
        subtotal: cantidad * precioUnitario,
        unidadDetalle: detalle.unidadDetalle
      }
    ]);
    setDetalle((current) => ({
      ...current,
      servicioId: "",
      cantidad: "1",
      precioUnitario: ""
    }));
  }

  function quitarServicio(key) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  async function confirmarPedido() {
    setError("");
    setSuccess("");

    if (!canConfirm) {
      setError("Selecciona cliente, sucursal y al menos un servicio antes de confirmar.");
      return;
    }

    setSaving(true);

    const payloadBase = {
      fechaPedido: localDateTime(0),
      fechaEntrega: `${pedido.fechaEntrega}T18:00:00`,
      total: total.toFixed(2),
      descripcion: pedido.origen,
      tipoPedido: "Pedido",
      formaPago: pedido.formaPago,
      clienteId: Number(pedido.clienteId),
      empleadoId: session.empleadoId,
      sucursalId: sucursalActiva.idSucursal,
      createdBy: session.empleadoId
    };

    try {
      const nuevoPedido = await crearPedido({
        ...payloadBase,
        estado: "Borrador"
      });

      await Promise.all(
        items.map((item) =>
          crearDetallePedido({
            cantidad: item.cantidad.toFixed(2),
            precioUnitario: item.precioUnitario.toFixed(2),
            subtotal: item.subtotal.toFixed(2),
            unidadDetalle: item.unidadDetalle,
            pedidoId: nuevoPedido.idPedido,
            servicioId: item.servicioId,
            createdBy: session.empleadoId
          })
        )
      );

      await actualizarPedido(nuevoPedido.idPedido, {
        ...payloadBase,
        estado: "Pendiente",
        updatedBy: session.empleadoId
      });

      setSuccess(`Pedido #${nuevoPedido.idPedido} confirmado correctamente.`);
      setPedido({
        clienteId: "",
        origen: "Presencial",
        formaPago: "Contado",
        fechaEntrega: localDate(1)
      });
      setItems([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="pos-page">
      <div className="pos-title">
        <span className="title-cart" aria-hidden="true" />
        <h1>Nuevo Pedido</h1>
      </div>

      {(error || success) && (
        <div className={error ? "pos-alert error" : "pos-alert success"}>{error || success}</div>
      )}

      <div className="pos-grid">
        <section className="pos-card order-card">
          <h2>Información del Pedido</h2>

          <label className="pos-field">
            <select
              disabled={loadingCatalogos}
              name="clienteId"
              onChange={updatePedido}
              value={pedido.clienteId}
            >
              <option value="">Buscar Cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.idCliente} value={cliente.idCliente}>
                  {nombreCliente(cliente)}
                </option>
              ))}
            </select>
          </label>

          <label className="pos-field floating">
            <span>Origen del Pedido</span>
            <select name="origen" onChange={updatePedido} value={pedido.origen}>
              <option>Presencial</option>
              <option>Telefono</option>
              <option>WhatsApp</option>
              <option>Correo</option>
            </select>
          </label>

          <div className="pos-field-row">
            <label className="pos-field floating">
              <span>Forma de Pago</span>
              <select name="formaPago" onChange={updatePedido} value={pedido.formaPago}>
                <option>Contado</option>
                <option>Credito</option>
                <option>Intercambio</option>
              </select>
            </label>

            <label className="pos-field floating">
              <span>Entrega</span>
              <input
                name="fechaEntrega"
                onChange={updatePedido}
                type="date"
                value={pedido.fechaEntrega}
              />
            </label>
          </div>

          <h3>Agregar Servicio</h3>

          <label className="pos-field">
            <select
              disabled={loadingCatalogos}
              name="servicioId"
              onChange={updateDetalle}
              value={detalle.servicioId}
            >
              <option value="">Servicio o Trabajo</option>
              {servicios.map((servicio) => (
                <option key={servicio.idServicio} value={servicio.idServicio}>
                  {servicio.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="pos-field-row">
            <label className="pos-field floating">
              <span>Cantidad</span>
              <input
                min="0.01"
                name="cantidad"
                onChange={updateDetalle}
                step="0.01"
                type="number"
                value={detalle.cantidad}
              />
            </label>

            <label className="pos-field floating">
              <span>Precio Unitario</span>
              <input
                min="0.01"
                name="precioUnitario"
                onChange={updateDetalle}
                placeholder="$ 0"
                step="0.01"
                type="number"
                value={detalle.precioUnitario}
              />
            </label>
          </div>

          <label className="pos-field floating compact-field">
            <span>Unidad</span>
            <select name="unidadDetalle" onChange={updateDetalle} value={detalle.unidadDetalle}>
              <option>Piezas</option>
              <option>Metros</option>
              <option>Litros</option>
            </select>
          </label>

          <button className="outline-action" disabled={!canAdd} onClick={agregarServicio} type="button">
            <span aria-hidden="true">+</span>
            Agregar al Pedido
          </button>
        </section>

        <section className="pos-card summary-card">
          <h2>Resumen del Pedido</h2>

          <div className="summary-table">
            <div className="summary-head">
              <span>Servicio</span>
              <span>Cant.</span>
              <span>P. Unit.</span>
              <span>Subtotal</span>
            </div>

            {items.length === 0 ? (
              <div className="empty-summary">No hay servicios agregados</div>
            ) : (
              <div className="summary-items">
                {items.map((item) => (
                  <div className="summary-row" key={item.key}>
                    <span>{item.nombre}</span>
                    <span>{item.cantidad}</span>
                    <span>{money(item.precioUnitario)}</span>
                    <span>
                      {money(item.subtotal)}
                      <button
                        aria-label={`Quitar ${item.nombre}`}
                        className="remove-line"
                        onClick={() => quitarServicio(item.key)}
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="totals-panel">
            <div>
              <span>Subtotal:</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div>
              <span>IVA (16%):</span>
              <strong>{money(iva)}</strong>
            </div>
            <div className="grand-total">
              <span>Total:</span>
              <strong>{money(total)}</strong>
            </div>
          </div>

          <button className="confirm-order" disabled={!canConfirm} onClick={confirmarPedido} type="button">
            {saving ? "Confirmando..." : "Confirmar Pedido"}
          </button>
        </section>
      </div>
    </section>
  );
}
