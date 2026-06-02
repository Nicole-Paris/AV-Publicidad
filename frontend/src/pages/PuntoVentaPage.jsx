import { useEffect, useMemo, useState } from "react";
import {
  crearCategoriaServicio,
  crearServicio,
  listarCategoriasServicio,
  listarClientes,
  listarServicios,
  listarSucursales,
  obtenerCliente
} from "../api/catalogApi.js";
import { actualizarPedido, crearDetallePedido, crearPedido } from "../api/pedidoApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { AppIcon } from "../components/AppIcon.jsx";

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

function normalizarTexto(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function PuntoVentaPage() {
  const { session } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteSuggestionsOpen, setClienteSuggestionsOpen] = useState(false);
  const [servicios, setServicios] = useState([]);
  const [categoriasServicio, setCategoriasServicio] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // modal de error flotante
  const [modalError, setModalError] = useState("");

  const [pedido, setPedido] = useState({
    clienteId: "",
    origen: "Presencial",
    formaPago: "Contado",
    fechaEntrega: localDate(1),
    tipoPedido: "Pedido"
  });
  const [detalle, setDetalle] = useState({
    servicioId: "",
    cantidad: "1",
    precioUnitario: "",
    unidadDetalle: "Piezas"
  });
  const [items, setItems] = useState([]);

  // Nuevo: modal de servicio
  const [modalServicio, setModalServicio] = useState(false);
  const [formServicio, setFormServicio] = useState({ nombre: "", descripcion: "", categoriaServicioId: "" });
  const [formCategoriaServicio, setFormCategoriaServicio] = useState({ nombre: "", descripcion: "" });
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);
  const [savingServicio, setSavingServicio] = useState(false);
  const [savingCategoriaServicio, setSavingCategoriaServicio] = useState(false);

  // helpers para notificaciones
  function mostrarError(msg) {
    setModalError(msg);
  }
  function mostrarSuccess(msg) {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 2000);
  }

  useEffect(() => {
    let active = true;

    async function cargarCatalogos() {
      setLoadingCatalogos(true);
      setError("");

      try {
        const [clientesData, serviciosData, sucursalesData, categoriasServicioData] = await Promise.all([
          listarClientes(),
          listarServicios(),
          listarSucursales(),
          listarCategoriasServicio()
        ]);

        if (!active) {
          return;
        }

        setClientes(clientesData);
        setServicios(serviciosData);
        setSucursales(sucursalesData);
        setCategoriasServicio(categoriasServicioData);
      } catch (err) {
        if (active) {
          mostrarError(err.message || String(err));
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

  const clientesFiltrados = useMemo(() => {
    const query = normalizarTexto(clienteSearch.trim());
    if (!query) {
      return [];
    }

    return clientes
      .filter((cliente) => normalizarTexto(nombreCliente(cliente)).includes(query))
      .slice(0, 6);
  }, [clienteSearch, clientes]);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.subtotal, 0),
    [items]
  );
  const iva = subtotal * IVA;
  const total = subtotal + iva;

  const canAdd =
    detalle.servicioId &&
    cantidadValida() &&
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

  function updateClienteSearch(event) {
    setClienteSearch(event.target.value);
    setClienteSuggestionsOpen(true);
    setPedido((current) => ({ ...current, clienteId: "" }));
  }

  function seleccionarCliente(cliente) {
    setClienteSearch(nombreCliente(cliente));
    setClienteSuggestionsOpen(false);
    setPedido((current) => ({ ...current, clienteId: String(cliente.idCliente) }));
  }

  function updateDetalle(event) {
    const { name, value } = event.target;
    // Nuevo: detectar opción nuevo servicio
    if (name === "servicioId" && value === "__nuevo__") {
      setModalServicio(true);
      return;
    }

    setDetalle((current) => {
      if (name === "cantidad" && current.unidadDetalle === "Piezas") {
        return { ...current, cantidad: value.replace(/\D/g, "") };
      }

      if (name === "unidadDetalle" && value === "Piezas") {
        return {
          ...current,
          unidadDetalle: value,
          cantidad: current.cantidad ? String(Math.max(1, Math.trunc(Number(current.cantidad)))) : ""
        };
      }

      return { ...current, [name]: value };
    });
  }

  function cantidadValida() {
    const cantidad = Number(detalle.cantidad);
    if (cantidad <= 0) {
      return false;
    }

    return detalle.unidadDetalle !== "Piezas" || Number.isInteger(cantidad);
  }

  function agregarServicio() {
    setError("");
    setSuccess("");

    if (!canAdd) {
      mostrarError(
        detalle.unidadDetalle === "Piezas"
          ? "Para piezas, la cantidad debe ser un numero entero."
          : "Selecciona un servicio, cantidad y precio unitario validos."
      );
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
      mostrarError("Selecciona cliente, sucursal y al menos un servicio antes de confirmar.");
      return;
    }

    // Validación de crédito si aplica
    if (pedido.formaPago === "Credito") {
      try {
        const clienteData = await obtenerCliente(Number(pedido.clienteId));
        const creditoDisponible =
          Number(clienteData.limiteCredito || 0) - Number(clienteData.creditoActual || 0);
        if (total > creditoDisponible) {
          mostrarError(`Crédito insuficiente. Disponible: ${money(creditoDisponible)}`);
          return;
        }
      } catch (err) {
        mostrarError(err.message || String(err));
        return;
      }
    }

    setSaving(true);

    const payloadBase = {
      fechaPedido: localDateTime(0),
      fechaEntrega: `${pedido.fechaEntrega}T18:00:00`,
      total: total.toFixed(2),
      descripcion: pedido.origen,
      tipoPedido: pedido.tipoPedido,
      formaPago: pedido.formaPago,
      clienteId: Number(pedido.clienteId),
      empleadoId: session.empleadoId,
      sucursalId: sucursalActiva.idSucursal,
      createdBy: session.empleadoId
    };

    try {
      // estado inicial según tipoPedido: Cotizacion -> Borrador, Pedido -> Pendiente
      const estadoInicial = pedido.tipoPedido === "Cotizacion" ? "Borrador" : "Pendiente";

      const nuevoPedido = await crearPedido({
        ...payloadBase,
        estado: estadoInicial,
        tipoPedido: pedido.tipoPedido
      });

      const pedidoId = Number(nuevoPedido.idPedido || nuevoPedido.id || nuevoPedido.pedidoId);

      // Crear detalles mientras el pedido está en Borrador o Pendiente
      await Promise.all(
        items.map((item) =>
          crearDetallePedido({
            cantidad: Number(item.cantidad).toFixed(2),
            precioUnitario: Number(item.precioUnitario).toFixed(2),
            subtotal: Number(item.subtotal).toFixed(2),
            unidadDetalle: item.unidadDetalle,
            pedidoId,
            servicioId: Number(item.servicioId),
            createdBy: session.empleadoId
          })
        )
      );

      // Solo si es Pedido (no Cotizacion), avanzar a "En proceso" DESPUÉS de los detalles
      if (pedido.tipoPedido !== "Cotizacion") {
        await actualizarPedido(pedidoId, {
          ...payloadBase,
          estado: "En proceso",
          updatedBy: session.empleadoId
        });
      }

      setItems([]);
      setDetalle({ servicioId: "", cantidad: "1", precioUnitario: "", unidadDetalle: "Piezas" });
      setPedido({
        clienteId: "",
        origen: "Presencial",
        formaPago: "Contado",
        fechaEntrega: localDate(1),
        tipoPedido: "Pedido"
      });

      setSuccess(`Pedido #${pedidoId} confirmado correctamente.`);

      try {
        window.dispatchEvent(new CustomEvent("pedido:creado", { detail: { pedidoId } }));
      } catch (e) {
        console.warn("No se pudo emitir evento pedido:creado", e);
      }
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function guardarServicio() {
    if (!formServicio.nombre.trim()) { mostrarError("Escribe el nombre del servicio."); return; }
    if (!formServicio.categoriaServicioId) { mostrarError("Selecciona una categoria de servicio."); return; }
    setSavingServicio(true);
    try {
      const nuevo = await crearServicio({
        nombre: formServicio.nombre.trim(),
        descripcion: formServicio.descripcion.trim(),
        estado: "Activo",
        categoriaServicioId: Number(formServicio.categoriaServicioId),
        createdBy: session.empleadoId
      });
      const serviciosActualizados = await listarServicios();
      setServicios(serviciosActualizados);
      setDetalle(d => ({ ...d, servicioId: String(nuevo.idServicio || "") }));
      setModalServicio(false);
      setFormServicio({ nombre: "", descripcion: "", categoriaServicioId: "" });
      setMostrarNuevaCategoria(false);
    } catch(err) {
      mostrarError(err.message || String(err));
    } finally {
      setSavingServicio(false);
    }
  }

  async function guardarCategoriaServicio() {
    if (!formCategoriaServicio.nombre.trim()) {
      mostrarError("Escribe el nombre de la categoria.");
      return;
    }

    setSavingCategoriaServicio(true);
    try {
      const nueva = await crearCategoriaServicio({
        nombre: formCategoriaServicio.nombre.trim(),
        descripcion: formCategoriaServicio.descripcion.trim(),
        estado: "Activo",
        createdBy: session.empleadoId
      });
      const categoriasActualizadas = await listarCategoriasServicio();
      setCategoriasServicio(categoriasActualizadas);
      setFormServicio((current) => ({
        ...current,
        categoriaServicioId: String(nueva.idCategoriaServicio || "")
      }));
      setFormCategoriaServicio({ nombre: "", descripcion: "" });
      setMostrarNuevaCategoria(false);
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSavingCategoriaServicio(false);
    }
  }

  return (
    <section className="pos-page">
      <div className="pos-title">
        <h1>Nuevo Pedido</h1>
        {sucursalActiva && (
          <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px" }}>
          </p>
        )}
      </div>

      {(error || success) && (
        <div className={error ? "pos-alert error" : "pos-alert success"}>{error || success}</div>
      )}

      <div className="pos-grid">
        <section className="pos-card order-card">
          <h2>Información del Pedido</h2>

          <label className="pos-field search-field autocomplete-field">
            <AppIcon name="search" size={18} />
            <input
              disabled={loadingCatalogos}
              onBlur={() => setTimeout(() => setClienteSuggestionsOpen(false), 120)}
              onChange={updateClienteSearch}
              onFocus={() => setClienteSuggestionsOpen(true)}
              placeholder="Buscar cliente por nombre"
              type="search"
              value={clienteSearch}
            />
            {clienteSuggestionsOpen && clienteSearch.trim() && (
              <div className="client-suggestions" role="listbox">
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map((cliente) => (
                    <button
                      key={cliente.idCliente}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => seleccionarCliente(cliente)}
                      role="option"
                      type="button"
                    >
                      <strong>{nombreCliente(cliente)}</strong>
                      <span>{cliente.telefono || "Sin telefono"}</span>
                    </button>
                  ))
                ) : (
                  <span className="client-suggestions-empty">Sin coincidencias</span>
                )}
              </div>
            )}
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

          <label className="pos-field floating">
            <span>Tipo de Pedido</span>
            <select name="tipoPedido" onChange={updatePedido} value={pedido.tipoPedido}>
              <option value="Pedido">Pedido</option>
              <option value="Cotizacion">Cotización</option>
            </select>
          </label>

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
              <option value="__nuevo__">+ Agregar nuevo servicio...</option>
            </select>
          </label>

          <div className="pos-field-row">
            <label className="pos-field floating">
              <span>Cantidad</span>
              <input
                inputMode={detalle.unidadDetalle === "Piezas" ? "numeric" : "decimal"}
                name="cantidad"
                onChange={updateDetalle}
                pattern={detalle.unidadDetalle === "Piezas" ? "[0-9]*" : undefined}
                type="text"
                value={detalle.cantidad}
              />
            </label>

            <label className="pos-field floating money-field">
              <span>Precio Unitario</span>
              <input
                inputMode="decimal"
                name="precioUnitario"
                onChange={updateDetalle}
                placeholder="0"
                type="text"
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
            {saving ? "Confirmando..." : (pedido.tipoPedido === "Cotizacion" ? "Crear Cotización" : "Confirmar Pedido")}
          </button>
        </section>
      </div>

      {/* Modal de error flotante */}
      {modalError && (
        <div className="modal-error-overlay" onClick={() => setModalError("")}>
          <div className="modal-error-card" onClick={e => e.stopPropagation()}>
            <p className="modal-error-icon">⚠</p>
            <p className="modal-error-msg">{modalError}</p>
            <button className="primary-button" onClick={() => setModalError("")}>Entendido</button>
          </div>
        </div>
      )}

      {modalServicio && (
        <div className="modal-overlay" onClick={() => setModalServicio(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>Nuevo Servicio</h2>
            <label className="pos-field floating">
              <span>Nombre</span>
              <input
                type="text"
                value={formServicio.nombre}
                onChange={e => setFormServicio(f => ({ ...f, nombre: e.target.value }))}
              />
            </label>
            <label className="pos-field floating">
              <span>Descripción</span>
              <input
                type="text"
                value={formServicio.descripcion}
                onChange={e => setFormServicio(f => ({ ...f, descripcion: e.target.value }))}
              />
            </label>
            <label className="pos-field floating">
              <span>Categoria</span>
              <select
                value={formServicio.categoriaServicioId}
                onChange={e => setFormServicio(f => ({ ...f, categoriaServicioId: e.target.value }))}
              >
                <option value="">Selecciona una categoria</option>
                {categoriasServicio.map(categoria => (
                  <option key={categoria.idCategoriaServicio} value={categoria.idCategoriaServicio}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="outline-action compact-action"
              type="button"
              onClick={() => setMostrarNuevaCategoria(current => !current)}
            >
              <span aria-hidden="true">+</span>
              Nueva categoria
            </button>
            {mostrarNuevaCategoria && (
              <div className="inline-create-panel">
                <label className="pos-field floating">
                  <span>Nombre de categoria</span>
                  <input
                    type="text"
                    value={formCategoriaServicio.nombre}
                    onChange={e => setFormCategoriaServicio(f => ({ ...f, nombre: e.target.value }))}
                  />
                </label>
                <label className="pos-field floating">
                  <span>Descripcion</span>
                  <input
                    type="text"
                    value={formCategoriaServicio.descripcion}
                    onChange={e => setFormCategoriaServicio(f => ({ ...f, descripcion: e.target.value }))}
                  />
                </label>
                <button
                  className="primary-button inline-create-button"
                  disabled={savingCategoriaServicio}
                  onClick={guardarCategoriaServicio}
                  type="button"
                >
                  {savingCategoriaServicio ? "Guardando..." : "Guardar categoria"}
                </button>
              </div>
            )}            <div style={{display:"flex", justifyContent:"flex-end", gap:12, marginTop:20}}>
              <button className="ghost-button" type="button" onClick={() => setModalServicio(false)}>Cancelar</button>
              <button className="primary-button" type="button" disabled={savingServicio} onClick={guardarServicio}>
                {savingServicio ? "Guardando..." : "Guardar Servicio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

