import { useEffect, useMemo, useState } from "react";
import {
  crearCategoriaServicio,
  crearCliente,
  crearServicio,
  listarCategoriaServicio,
  listarClientes,
  listarServicios,
  listarSucursales,
  listarServiciosMateriales,
  obtenerCliente
} from "../api/catalogApi.js";
import { crearDetallePedido, crearPedido } from "../api/pedidoApi.js";
import { listarInventarios, listarMateriales, crearMovimiento } from "../api/inventarioApi.js";
import { listarEmpleados } from "../api/empleadoApi.js";
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
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function materialActivo(material) {
  const estado = String(material?.estado || "").toLowerCase();
  return estado === "disponible" || estado === "activo";
}

function servicioActivo(servicio) {
  return String(servicio?.estado || "Activo").toLowerCase() === "activo";
}

export function PuntoVentaPage() {
  const { session } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteSuggestionsOpen, setClienteSuggestionsOpen] = useState(false);
  const [servicios, setServicios] = useState([]);
  const [serviciosMateriales, setServiciosMateriales] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [empleados, setEmpleados] = useState([]);
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

  const [modalCliente, setModalCliente] = useState(false);
  const [savingCliente, setSavingCliente] = useState(false);
  const [formCliente, setFormCliente] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    tipo: "No frecuente",
    tieneCredito: false,
    creditoActual: "0.00",
    limiteCredito: "0.00",
    direccion: "",
    rfc: "",
    codigoPostal: "",
    razonSocial: ""
  });

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
        const [
          clientesData,
          serviciosData,
          sucursalesData,
          categoriasServicioData,
          empleadosData,
          serviciosMaterialesData,
          materialesData
        ] = await Promise.all([
          listarClientes(),
          listarServicios(),
          listarSucursales(),
          listarCategoriaServicio(),
          listarEmpleados(),
          listarServiciosMateriales(),
          listarMateriales()
        ]);

        if (!active) {
          return;
        }

        setClientes(clientesData);
        setServicios(serviciosData);
        setSucursales(sucursalesData);
        setCategoriasServicio(categoriasServicioData);
        setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
        setServiciosMateriales(Array.isArray(serviciosMaterialesData) ? serviciosMaterialesData : []);
        setMateriales(Array.isArray(materialesData) ? materialesData : []);
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

  function registroDeSucursal(registro) {
    const sucursalId = session?.sucursalIdSucursal || session?.sucursalId;
    if (!sucursalId) {
      return true;
    }
    const empleado = empleados.find((item) => Number(item.idEmpleado) === Number(registro.createdBy));
    return Number(empleado?.sucursalIdSucursal) === Number(sucursalId);
  }

  const clientesFiltrados = useMemo(() => {
    const query = normalizarTexto(clienteSearch.trim());
    if (!query) {
      return [];
    }

    return clientes
      .filter(registroDeSucursal)
      .filter((cliente) => normalizarTexto(nombreCliente(cliente)).includes(query))
      .slice(0, 6);
  }, [clienteSearch, clientes, empleados, session]);

  const serviciosActivos = useMemo(
    () => servicios.filter((servicio) => registroDeSucursal(servicio) && servicioActivo(servicio)),
    [servicios, empleados, session]
  );

  function unidadDeServicio(servicioId) {
    const relacion = serviciosMateriales.find((item) => Number(item.servicioId) === Number(servicioId));
    const material = materiales.find((item) => Number(item.idMaterial || item.id) === Number(relacion?.materialId));
    return material?.unidad || "Piezas";
  }

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

  function abrirModalCliente() {
    const partes = clienteSearch.trim().split(/\s+/).filter(Boolean);
    setFormCliente((current) => ({
      ...current,
      nombre: current.nombre || partes[0] || "",
      apellidoPaterno: current.apellidoPaterno || partes[1] || "",
      apellidoMaterno: current.apellidoMaterno || partes.slice(2).join(" ") || ""
    }));
    setClienteSuggestionsOpen(false);
    setModalCliente(true);
  }

  function updateClienteForm(event) {
    const { name, type, checked, value } = event.target;
    const nextValue = name === "limiteCredito" || name === "creditoActual"
      ? limpiarMontoPositivo(value)
      : value;
    setFormCliente((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : nextValue
    }));
  }

  async function guardarCliente() {
    if (!formCliente.nombre.trim()) {
      mostrarError("Escribe el nombre del cliente.");
      return;
    }
    if (!formCliente.apellidoPaterno.trim()) {
      mostrarError("Escribe el apellido paterno del cliente.");
      return;
    }
    if (!formCliente.apellidoMaterno.trim()) {
      mostrarError("Escribe el apellido materno del cliente.");
      return;
    }
    if (!formCliente.telefono.trim()) {
      mostrarError("Escribe el telefono del cliente.");
      return;
    }
    if (Number(formCliente.limiteCredito || 0) < 0) {
      mostrarError("El limite de credito no puede ser negativo.");
      return;
    }

    setSavingCliente(true);
    try {
      const razonSocial = formCliente.razonSocial.trim() || [
        formCliente.nombre,
        formCliente.apellidoPaterno,
        formCliente.apellidoMaterno
      ].filter(Boolean).join(" ");
      const nuevo = await crearCliente({
        nombre: formCliente.nombre.trim(),
        apellidoPaterno: formCliente.apellidoPaterno.trim(),
        apellidoMaterno: formCliente.apellidoMaterno.trim(),
        telefono: formCliente.telefono.trim(),
        tipo: formCliente.tipo,
        tieneCredito: Boolean(formCliente.tieneCredito),
        creditoActual: Number(formCliente.creditoActual || 0).toFixed(2),
        limiteCredito: Number(formCliente.limiteCredito || 0).toFixed(2),
        direccion: formCliente.direccion.trim(),
        rfc: formCliente.rfc.trim() || null,
        codigoPostal: formCliente.codigoPostal.trim(),
        razonSocial: razonSocial.slice(0, 30),
        createdBy: session.empleadoId
      });
      const clientesActualizados = await listarClientes();
      setClientes(clientesActualizados);
      seleccionarCliente(nuevo);
      setFormCliente({
        nombre: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        telefono: "",
        tipo: "No frecuente",
        tieneCredito: false,
        creditoActual: "0.00",
        limiteCredito: "0.00",
        direccion: "",
        rfc: "",
        codigoPostal: "",
        razonSocial: ""
      });
      setModalCliente(false);
      mostrarSuccess("Cliente agregado correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSavingCliente(false);
    }
  }

  function updateDetalle(event) {
    const { name, value } = event.target;
    // Nuevo: detectar opción nuevo servicio
    if (name === "servicioId" && value === "__nuevo__") {
      setModalServicio(true);
      return;
    }

    setDetalle((current) => {
      if (name === "servicioId") {
        const unidadDetalle = value ? unidadDeServicio(value) : "Piezas";
        return {
          ...current,
          servicioId: value,
          unidadDetalle,
          cantidad: unidadDetalle === "Piezas" && current.cantidad
            ? String(Math.max(1, Math.trunc(Number(current.cantidad))))
            : current.cantidad
        };
      }

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

      if (name === "precioUnitario") {
        return { ...current, precioUnitario: limpiarMontoPositivo(value) };
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
    if (!servicio || !servicioActivo(servicio)) {
      mostrarError("No se puede agregar un servicio inactivo al pedido.");
      return;
    }

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

  function limpiarMontoPositivo(value) {
    const limpio = value.replace(/[^\d.]/g, "");
    const partes = limpio.split(".");
    return partes.length > 1 ? `${partes[0]}.${partes.slice(1).join("")}` : limpio;
  }

  function actualizarItem(key, field, value) {
    setItems((current) => current.map((item) => {
      if (item.key !== key) {
        return item;
      }

      let nextValue = value;
      if (field === "cantidad" && item.unidadDetalle === "Piezas") {
        nextValue = value.replace(/\D/g, "");
      }
      if (field === "precioUnitario") {
        nextValue = limpiarMontoPositivo(value);
      }

      const actualizado = { ...item, [field]: nextValue };
      const cantidad = Number(actualizado.cantidad || 0);
      const precioUnitario = Number(actualizado.precioUnitario || 0);
      return {
        ...actualizado,
        subtotal: cantidad * precioUnitario
      };
    }));
  }

  async function confirmarPedido() {
    setError("");
    setSuccess("");

    if (!canConfirm) {
      mostrarError("Selecciona cliente, sucursal y al menos un servicio antes de confirmar.");
      return;
    }

    const servicioInactivo = items
      .map((item) => servicios.find((servicio) => Number(servicio.idServicio) === Number(item.servicioId)))
      .find((servicio) => !servicioActivo(servicio));

    if (servicioInactivo) {
      mostrarError(`El servicio ${servicioInactivo.nombre} esta inactivo y no se puede agregar a un pedido.`);
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

    let inventarioValidado = { serviciosMateriales: [], inventarios: [] };
    try {
      const [serviciosMaterialesData, inventariosData, materialesData] = await Promise.all([
        listarServiciosMateriales(),
        listarInventarios(),
        listarMateriales()
      ]);

      const requerimientos = new Map();

      items.forEach((item) => {
        const materialesServicio = (serviciosMaterialesData || [])
          .filter((sm) => Number(sm.servicioId) === Number(item.servicioId));

        materialesServicio.forEach((sm) => {
          const material = (materialesData || [])
            .find((mat) => Number(mat.idMaterial || mat.id) === Number(sm.materialId));

          if (!materialActivo(material)) {
            throw new Error(`El material ${material?.nombre || sm.materialId} esta inactivo y no se puede usar en pedidos.`);
          }

          const cantidadPorUnidad = Number(sm.cantidadUsada ?? sm.cantidad ?? 0);
          const cantidadTotal = Number(item.cantidad) * cantidadPorUnidad;

          if (!cantidadTotal || cantidadTotal <= 0) {
            return;
          }

          const materialId = Number(sm.materialId);
          requerimientos.set(materialId, (requerimientos.get(materialId) || 0) + cantidadTotal);
        });
      });

      requerimientos.forEach((cantidadNecesaria, materialId) => {
        const inventario = (inventariosData || []).find((inv) =>
          Number(inv.materialId) === Number(materialId) &&
          Number(inv.sucursalId) === Number(sucursalActiva.idSucursal)
        );
        const material = (materialesData || []).find((mat) => Number(mat.idMaterial || mat.id) === Number(materialId));
        const stockActual = Number(inventario?.stockActual || 0);

        if (!inventario || stockActual < cantidadNecesaria) {
          throw new Error(`No hay piezas suficientes de ${material?.nombre || `material ${materialId}`}. Stock disponible: ${stockActual}.`);
        }
      });

      inventarioValidado = {
        serviciosMateriales: serviciosMaterialesData || [],
        inventarios: inventariosData || []
      };
    } catch (err) {
      mostrarError(err.message || String(err));
      return;
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

      // Reducir stock en inventario según materiales asociados a los servicios
      try {
        const svMats = inventarioValidado.serviciosMateriales;
        const invs = inventarioValidado.inventarios;

        await Promise.all(items.map(async (item) => {
          const mats = (svMats || []).filter(sm => Number(sm.servicioId) === Number(item.servicioId));
          if (!mats.length) return;
          await Promise.all(mats.map(async (sm) => {
            const cantidadPorUnidad = Number(sm.cantidadUsada ?? sm.cantidad ?? 0);
            const cantidadTotal = Number(item.cantidad) * cantidadPorUnidad;
            if (!cantidadTotal || cantidadTotal <= 0) return;
            const inv = (invs || []).find(i =>
              Number(i.materialId) === Number(sm.materialId) &&
              Number(i.sucursalId) === Number(sucursalActiva.idSucursal)
            );
            if (!inv) {
              console.warn(`No se encontró inventario para material ${sm.materialId} en sucursal ${sucursalActiva.idSucursal}`);
              return;
            }
            await crearMovimiento({
              cantidad: Number(cantidadTotal),
              fecha: localDateTime(0),
              tipo: "Salida",
              motivo: `Consumo por pedido ${pedidoId}`,
              inventarioId: Number(inv.idInventario || inv.id),
              createdBy: session.empleadoId
            });
          }));
        }));
      } catch (errInv) {
        console.warn("No se pudo actualizar inventario automáticamente:", errInv);
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
      const categoriasActualizadas = await listarCategoriaServicio();
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
            {clienteSuggestionsOpen && (
              <div className="client-suggestions" role="listbox">
                {clientesFiltrados.length > 0 ? (
                  <>
                    {clientesFiltrados.map((cliente) => (
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
                    ))}
                    <button
                      className="client-suggestions-action"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={abrirModalCliente}
                      type="button"
                    >
                      + Agregar nuevo cliente
                    </button>
                  </>
                ) : (
                  <>
                    <span className="client-suggestions-empty">
                      {clienteSearch.trim() ? "Sin coincidencias" : "Busca un cliente o agrega uno nuevo"}
                    </span>
                    <button
                      className="client-suggestions-action"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={abrirModalCliente}
                      type="button"
                    >
                      + Agregar nuevo cliente
                    </button>
                  </>
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

          <div className="pos-field-row order-meta-row">
            <label className="pos-field floating">
              <span>Forma de Pago</span>
              <select name="formaPago" onChange={updatePedido} value={pedido.formaPago}>
                <option>Contado</option>
                <option>Credito</option>
                <option>Intercambio</option>
              </select>
            </label>

            <label className="pos-field floating date-field">
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
              <option value="" disabled>Servicio o Trabajo</option>
              {serviciosActivos.map((servicio) => (
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
                min="0"
                onChange={updateDetalle}
                placeholder="0"
                type="text"
                value={detalle.precioUnitario}
              />
            </label>
          </div>

          <label className="pos-field floating compact-field">
            <span>Unidad</span>
            <select
              disabled
              name="unidadDetalle"
              onChange={updateDetalle}
              value={detalle.unidadDetalle}
            >
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
                    <span>
                      <input
                        aria-label={`Cantidad de ${item.nombre}`}
                        className="summary-edit-input"
                        inputMode={item.unidadDetalle === "Piezas" ? "numeric" : "decimal"}
                        onChange={(event) => actualizarItem(item.key, "cantidad", event.target.value)}
                        type="text"
                        value={item.cantidad}
                      />
                    </span>
                    <span className="summary-money-edit">
                      <input
                        aria-label={`Precio unitario de ${item.nombre}`}
                        className="summary-edit-input"
                        inputMode="decimal"
                        min="0"
                        onChange={(event) => actualizarItem(item.key, "precioUnitario", event.target.value)}
                        type="text"
                        value={item.precioUnitario}
                      />
                    </span>
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

      {modalCliente && (
        <div className="modal-overlay" onClick={() => setModalCliente(false)}>
          <div className="modal-card customer-modal" onClick={e => e.stopPropagation()}>
            <h2>Nuevo Cliente</h2>
            <div className="modal-grid">
              <label className="pos-field floating">
                <span>Nombre</span>
                <input name="nombre" onChange={updateClienteForm} type="text" value={formCliente.nombre} />
              </label>
              <label className="pos-field floating">
                <span>Apellido paterno</span>
                <input name="apellidoPaterno" onChange={updateClienteForm} type="text" value={formCliente.apellidoPaterno} />
              </label>
              <label className="pos-field floating">
                <span>Apellido materno</span>
                <input name="apellidoMaterno" onChange={updateClienteForm} type="text" value={formCliente.apellidoMaterno} />
              </label>
              <label className="pos-field floating">
                <span>Telefono</span>
                <input name="telefono" onChange={updateClienteForm} type="text" value={formCliente.telefono} />
              </label>
              <label className="pos-field floating">
                <span>Tipo</span>
                <select name="tipo" onChange={updateClienteForm} value={formCliente.tipo}>
                  <option>Frecuente</option>
                  <option>No frecuente</option>
                </select>
              </label>
              <label className="pos-field floating">
                <span>RFC</span>
                <input name="rfc" onChange={updateClienteForm} type="text" value={formCliente.rfc} />
              </label>
              <label className="pos-field floating">
                <span>Codigo postal</span>
                <input name="codigoPostal" onChange={updateClienteForm} type="text" value={formCliente.codigoPostal} />
              </label>
              <label className="pos-field floating">
                <span>Direccion</span>
                <input name="direccion" onChange={updateClienteForm} type="text" value={formCliente.direccion} />
              </label>
              <label className="pos-field floating modal-grid-wide">
                <span>Razon social</span>
                <input name="razonSocial" onChange={updateClienteForm} type="text" value={formCliente.razonSocial} />
              </label>
              <label className="inline-check modal-grid-wide">
                <input
                  checked={formCliente.tieneCredito}
                  name="tieneCredito"
                  onChange={updateClienteForm}
                  type="checkbox"
                />
                <span>Tiene credito</span>
              </label>
              {formCliente.tieneCredito && (
                <label className="pos-field floating money-field modal-grid-wide">
                  <span>Limite de credito</span>
                  <input
                    inputMode="decimal"
                    name="limiteCredito"
                    min="0"
                    onChange={updateClienteForm}
                    type="text"
                    value={formCliente.limiteCredito}
                  />
                </label>
              )}
            </div>
            <div style={{display:"flex", justifyContent:"flex-end", gap:12, marginTop:4}}>
              <button className="ghost-button" type="button" onClick={() => setModalCliente(false)}>Cancelar</button>
              <button className="primary-button" type="button" disabled={savingCliente} onClick={guardarCliente}>
                {savingCliente ? "Guardando..." : "Guardar Cliente"}
              </button>
            </div>
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

