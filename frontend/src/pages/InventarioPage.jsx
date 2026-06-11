import { Fragment, useEffect, useMemo, useState, useRef } from "react";
import {
  listarCategoriasMaterial,
  listarMateriales,
  crearMaterial,
  actualizarMaterial,
  crearCategoriaMaterial,
  actualizarCategoriaMaterial,
  listarInventarios,
  crearInventario,
  actualizarInventario,
  listarMovimientos,
  crearMovimiento
} from "../api/inventarioApi.js";
import { listarEmpleados } from "../api/empleadoApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { esEmpleado } from "../auth/permissions.js";
import { Pagination } from "../components/Pagination.jsx";

const CURRENCY = new Intl.NumberFormat("es-MX", { currency: "MXN", style: "currency" });
const PAGE_SIZE = 30;
const MOVEMENTS_PAGE_SIZE = 30;

function money(value) {
  return CURRENCY.format(value || 0);
}

function normalizarTexto(value) {
  return (value || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function nowLocalDateTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function estadoMaterialParaBackend(estado) {
  return estado === "Inactivo" ? "No disponible" : "Disponible";
}

function estadoMaterialParaVista(estado) {
  return estado === "No disponible" ? "Inactivo" : "Activo";
}

function materialActivo(material) {
  return estadoMaterialParaVista(material?.estado) === "Activo";
}

function limpiarCantidadMovimiento(value) {
  const limpio = String(value || "").replace(/[+-]/g, "").replace(/[^\d.]/g, "");
  const partes = limpio.split(".");
  return partes.length > 1 ? `${partes[0]}.${partes.slice(1).join("")}` : limpio;
}

function idMovimiento(movimiento) {
  return movimiento?.idMovimientoInventario || movimiento?.idMovimiento || movimiento?.id;
}

/* Componente interno: BuscadorMaterial */
function BuscadorMaterial({ materiales, value, onChange, placeholder = "Escribe el nombre..." }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const matches = useMemo(() => {
    const q = normalizarTexto(query.trim());
    if (!q) return [];
    return materiales.filter((m) => normalizarTexto(m.nombre).includes(q));
  }, [materiales, query]);

  function handleChange(e) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setOpen(Boolean(v.trim() && matches.length > 0));
  }

  function handleSelect(name) {
    setQuery(name);
    onChange(name);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(Boolean(query.trim() && matches.length > 0))}
      />
      {open && matches.length > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 10,
            background: "#fff",
            border: "1px solid #e2e2e2",
            borderRadius: 8,
            maxHeight: 200,
            overflowY: "auto",
            marginTop: 8,
            left: 0,
            right: 0,
            boxShadow: "0 6px 20px rgba(2,6,23,0.08)"
          }}
        >
          {matches.map((m) => (
            <div
              key={m.idMaterial || m.id}
              onClick={() => handleSelect(m.nombre)}
              style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #f4f4f4" }}
            >
              {m.nombre}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function InventarioPage() {
  const { session } = useAuth();
  const soloEmpleado = esEmpleado(session);
  const [tabActivo, setTabActivo] = useState("materiales");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formularioAbierto, setFormularioAbierto] = useState(false);

  const [materiales, setMateriales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [inventarios, setInventarios] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [materialExpandido, setMaterialExpandido] = useState(null);
  const [movimientoExpandido, setMovimientoExpandido] = useState(null);
  const [auditModal, setAuditModal] = useState(null);
  const [materialEditando, setMaterialEditando] = useState(null);

  const [buscar, setBuscar] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [buscarCategoria, setBuscarCategoria] = useState("");
  const [estadoCategoriaFiltro, setEstadoCategoriaFiltro] = useState("");
  const [paginaMateriales, setPaginaMateriales] = useState(1);
  const [paginaMovimientos, setPaginaMovimientos] = useState(1);
  const sucursalActivaId = session?.sucursalIdSucursal || session?.sucursalId;

  const [nuevaCat, setNuevaCat] = useState({
    visible: false, editando: null, nombre: "", descripcion: "", estado: "Activo"
  });

  // modal error
  const [modalError, setModalError] = useState("");

  // nueva unidad
  const [nuevaUnidad, setNuevaUnidad] = useState({ visible: false, nombre: "" });
  const [unidadesExtra, setUnidadesExtra] = useState([]);

  const [formulario, setFormulario] = useState({
    // materiales
    nombre: "",
    unidad: "Metros",
    costoUnitario: "",
    categoriaMaterialId: "",
    estado: "Activo",
    // stock moved into material form
    stockActual: "",
    stockMinimo: "",
    // movimiento
    inventarioId: "",
    tipo: "Entrada",
    cantidad: "",
    motivo: "",
    fecha: nowLocalDateTime(),
    // shared
    nombreMaterial: ""
  });

  // helpers para notificaciones temporales
  function mostrarError(msg) {
    setError("");
    setModalError(msg);
  }
  function mostrarSuccess(msg) {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 2000);
  }

  useEffect(() => {
    let active = true;
    async function cargarTodo() {
      setLoading(true);
      setError("");
      try {
        const [cats, mats, invs, movs, emps] = await Promise.all([
          listarCategoriasMaterial(),
          listarMateriales(),
          listarInventarios(),
          listarMovimientos(),
          listarEmpleados()
        ]);
        if (!active) return;
        setCategorias(cats);
        setMateriales(mats);
        setInventarios(invs);
        setMovimientos(movs);
        setEmpleados(Array.isArray(emps) ? emps : []);
      } catch (err) {
        if (active) mostrarError(err.message || String(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    cargarTodo();
    return () => {
      active = false;
    };
  }, []);

  // filtros
  const materialesFiltrados = useMemo(() => {
    const q = normalizarTexto(buscar.trim());
    return materiales
      .filter((m) => {
        const inv = inventarios.find((i) =>
          Number(i.materialId) === Number(m.idMaterial || m.id) &&
          (!sucursalActivaId || Number(i.sucursalId) === Number(sucursalActivaId))
        );
        return Boolean(inv);
      })
      .filter((m) => (!categoriaFiltro || String(m.categoriaMaterialId) === String(categoriaFiltro)))
      .filter((m) => (!q || normalizarTexto(m.nombre).includes(q)));
  }, [materiales, inventarios, buscar, categoriaFiltro, sucursalActivaId]);

  const movimientosFiltrados = useMemo(() => {
    return movimientos
      .filter((movimiento) => {
        const inventario = inventarios.find((inv) =>
          Number(inv.idInventario || inv.id) === Number(movimiento.inventarioId)
        );
        return !sucursalActivaId || Number(inventario?.sucursalId) === Number(sucursalActivaId);
      })
      .sort((a, b) => {
        const fechaA = new Date(a.fecha || a.createdAt || 0).getTime();
        const fechaB = new Date(b.fecha || b.createdAt || 0).getTime();
        if (fechaB !== fechaA) {
          return fechaB - fechaA;
        }
        return Number(idMovimiento(b) || 0) - Number(idMovimiento(a) || 0);
      });
  }, [movimientos, inventarios, sucursalActivaId]);

  const categoriasFiltradas = useMemo(() => {
    const q = normalizarTexto(buscarCategoria.trim());
    return categorias
      .filter((categoria) => !estadoCategoriaFiltro || categoria.estado === estadoCategoriaFiltro)
      .filter((categoria) => {
        if (!q) return true;
        return normalizarTexto(categoria.nombre).includes(q)
          || normalizarTexto(categoria.descripcion).includes(q);
      });
  }, [categorias, buscarCategoria, estadoCategoriaFiltro]);

  const materialesPaginados = useMemo(() => {
    const inicio = (paginaMateriales - 1) * PAGE_SIZE;
    return materialesFiltrados.slice(inicio, inicio + PAGE_SIZE);
  }, [materialesFiltrados, paginaMateriales]);

  const movimientosPaginados = useMemo(() => {
    const inicio = (paginaMovimientos - 1) * MOVEMENTS_PAGE_SIZE;
    return movimientosFiltrados.slice(inicio, inicio + MOVEMENTS_PAGE_SIZE);
  }, [movimientosFiltrados, paginaMovimientos]);

  useEffect(() => {
    setPaginaMateriales(1);
  }, [buscar, categoriaFiltro, sucursalActivaId]);

  useEffect(() => {
    setPaginaMovimientos(1);
  }, [sucursalActivaId]);

  // helpers para buscar inventario por material (primera coincidencia)
  function inventarioParaMaterial(materialId) {
    return inventarios.find((i) =>
      Number(i.materialId) === Number(materialId) &&
      (!sucursalActivaId || Number(i.sucursalId) === Number(sucursalActivaId))
    );
  }

  function nombreEmpleado(id) {
    const empleado = empleados.find((item) => Number(item.idEmpleado) === Number(id));
    if (!id) {
      return "-";
    }
    if (!empleado) {
      return `Empleado ${id}`;
    }
    return [empleado.nombre, empleado.apellidoPaterno, empleado.apellidoMaterno].filter(Boolean).join(" ");
  }

  function fechaHora(value) {
    return value ? new Date(value).toLocaleString("es-MX") : "-";
  }

  function abrirAuditoria(titulo, registro, extra = []) {
    setAuditModal({
      titulo,
      items: [
        ["Registrado por", nombreEmpleado(registro.createdBy)],
        ["Registro", fechaHora(registro.createdAt || registro.fecha)],
        ["Editado por", nombreEmpleado(registro.updatedBy)],
        ["Ultima edicion", fechaHora(registro.updatedAt)],
        ["Eliminado por", nombreEmpleado(registro.deletedBy)],
        ["Eliminacion", fechaHora(registro.deletedAt)],
        ...extra
      ]
    });
  }

  const materialesActivos = useMemo(
    () => materiales.filter((material) => materialActivo(material)),
    [materiales]
  );

  function abrirNuevaCategoriaMaterial() {
    setNuevaCat({ visible: true, editando: null, nombre: "", descripcion: "", estado: "Activo" });
  }

  // acciones de guardado
  async function guardarNuevaCategoria() {
    if (!nuevaCat.nombre.trim()) {
      mostrarError("Escribe un nombre para la categoría.");
      return;
    }
    const nombreNormalizado = nuevaCat.nombre.trim().toLowerCase();
    const categoriaDuplicada = categorias.some((categoria) => {
      const idCategoria = Number(categoria.idCategoriaMaterial || categoria.id);
      const idEditando = nuevaCat.editando
        ? Number(nuevaCat.editando.idCategoriaMaterial || nuevaCat.editando.id)
        : null;
      return (categoria.nombre || "").trim().toLowerCase() === nombreNormalizado
        && idCategoria !== idEditando;
    });
    if (categoriaDuplicada) {
      mostrarError("Ya existe una categoría de material con ese nombre.");
      return;
    }
    if (nuevaCat.editando && nuevaCat.estado === "Inactivo") {
      const idCategoriaEditando = Number(nuevaCat.editando.idCategoriaMaterial || nuevaCat.editando.id);
      const tieneMaterialesLigados = materiales.some((material) =>
        Number(material.categoriaMaterialId) === idCategoriaEditando && !material.deletedAt
      );
      const estabaActiva = (nuevaCat.editando.estado || "Activo") !== "Inactivo";
      if (estabaActiva && tieneMaterialesLigados) {
        mostrarError("No se puede inactivar la categoría porque tiene materiales ligados.");
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        nombre: nuevaCat.nombre.trim(),
        descripcion: nuevaCat.descripcion.trim(),
        estado: nuevaCat.estado || "Activo",
        createdBy: nuevaCat.editando?.createdBy || session.empleadoId,
        updatedBy: nuevaCat.editando ? session.empleadoId : null
      };

      if (nuevaCat.editando) {
        await actualizarCategoriaMaterial(nuevaCat.editando.idCategoriaMaterial || nuevaCat.editando.id, payload);
      } else {
        await crearCategoriaMaterial(payload);
      }

      const cats = await listarCategoriasMaterial();
      setCategorias(cats);
      // seleccionar automáticamente la categoría recién creada
      const nueva = cats.find(c => (c.nombre || "").trim() === nuevaCat.nombre.trim());
      if (nueva) setFormulario(f => ({ ...f, categoriaMaterialId: nueva.idCategoriaMaterial || nueva.id }));
      setNuevaCat({ visible: false, editando: null, nombre: "", descripcion: "", estado: "Activo" });
      mostrarSuccess(nuevaCat.editando ? "Categoría actualizada." : "Categoría creada y seleccionada.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  function guardarNuevaUnidad() {
    if (!nuevaUnidad.nombre.trim()) {
      mostrarError("Escribe un nombre para la unidad.");
      return;
    }
    const nombre = nuevaUnidad.nombre.trim();
    setUnidadesExtra(u => [...u, nombre]);
    setFormulario(f => ({ ...f, unidad: nombre }));
    setNuevaUnidad({ visible: false, nombre: "" });
  }

  async function guardarMaterial(e) {
    e?.preventDefault();
    setError("");
    setSuccess("");
    if (!sucursalActivaId) {
      mostrarError("No hay una sucursal activa para registrar el material.");
      return;
    }
    if (!formulario.nombre || !formulario.costoUnitario || !formulario.categoriaMaterialId) {
      mostrarError("Completa nombre, costo y categoría.");
      return;
    }
    setSaving(true);
    try {
      const esEdicion = Boolean(materialEditando);
      const payloadMaterial = {
        nombre: formulario.nombre,
        unidad: formulario.unidad,
        costoUnitario: Number(formulario.costoUnitario),
        categoriaMaterialId: Number(formulario.categoriaMaterialId),
        estado: estadoMaterialParaBackend(formulario.estado),
        createdBy: materialEditando?.material?.createdBy || session.empleadoId,
        updatedBy: esEdicion ? session.empleadoId : null
      };

      const creada = esEdicion
        ? await actualizarMaterial(materialEditando.material.idMaterial || materialEditando.material.id, payloadMaterial)
        : await crearMaterial({
            ...payloadMaterial,
            sucursalId: Number(sucursalActivaId)
          });

      // crear inventario inicial para el material recién creado
      const idMaterialNuevo = creada.idMaterial || creada.id;
      if (!esEdicion && idMaterialNuevo) {
        await crearInventario({
          stockActual: Number(formulario.stockActual || 0),
          stockMinimo: Number(formulario.stockMinimo || 0),
          materialId: Number(idMaterialNuevo),
          sucursalId: Number(sucursalActivaId),
          createdBy: session.empleadoId
        });
      }
      if (esEdicion && materialEditando.inventario) {
        await actualizarInventario(materialEditando.inventario.idInventario || materialEditando.inventario.id, {
          stockActual: Number(formulario.stockActual || 0),
          stockMinimo: Number(formulario.stockMinimo || 0),
          materialId: Number(materialEditando.material.idMaterial || materialEditando.material.id),
          sucursalId: Number(sucursalActivaId || materialEditando.inventario.sucursalId),
          createdBy: materialEditando.inventario.createdBy || session.empleadoId,
          updatedBy: session.empleadoId
        });
      }

      // recargar todo en paralelo
      const [cats, mats, invs, movs] = await Promise.all([
        listarCategoriasMaterial(),
        listarMateriales(),
        listarInventarios(),
        listarMovimientos()
      ]);
      setCategorias(cats);
      setMateriales(mats);
      setInventarios(invs);
      setMovimientos(movs);

      // limpiar y cerrar
      setFormulario((f) => ({
        ...f,
        nombre: "",
        unidad: "Metros",
        costoUnitario: "",
        categoriaMaterialId: "",
        estado: "Activo",
        nombreMaterial: "",
        stockActual: "",
        stockMinimo: ""
      }));
      setMaterialEditando(null);
      setFormularioAbierto(false);
      mostrarSuccess(esEdicion ? "Material actualizado correctamente." : "Material creado correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function guardarMovimiento(e) {
    e?.preventDefault();
    setError("");
    setSuccess("");
    if (!sucursalActivaId) {
      mostrarError("No hay una sucursal activa para registrar el movimiento.");
      return;
    }
    if (!formulario.nombreMaterial || !formulario.cantidad) {
      mostrarError("Selecciona material y cantidad.");
      return;
    }
    if (!formulario.motivo || !formulario.motivo.trim()) {
      mostrarError("El motivo es obligatorio.");
      return;
    }

    // comprobar si el material se mide en piezas (sin decimales)
    const matSeleccionado = materiales.find(m => normalizarTexto(m.nombre) === normalizarTexto((formulario.nombreMaterial || "").trim()));
    const esPiezas = matSeleccionado && normalizarTexto(matSeleccionado.unidad || "").includes("piez");

    if (esPiezas && String(formulario.cantidad).includes(".")) {
      mostrarError("Este material se mide en piezas, no se permiten decimales.");
      return;
    }

    if (matSeleccionado && !materialActivo(matSeleccionado)) {
      mostrarError("No se pueden hacer movimientos de un material inactivo.");
      return;
    }

    setSaving(true);
    try {
      const mat = materiales.find(
        (m) => normalizarTexto(m.nombre) === normalizarTexto((formulario.nombreMaterial || "").trim())
      );
      if (!mat) {
        mostrarError("Material no encontrado.");
        setSaving(false);
        return;
      }
      const inv = inventarios.find(
        (i) =>
          Number(i.materialId) === Number(mat.idMaterial) &&
          Number(i.sucursalId) === Number(sucursalActivaId)
      );
      if (!inv) {
        mostrarError("No hay inventario registrado para ese material en esa sucursal.");
        setSaving(false);
        return;
      }
      if (formulario.tipo === "Salida" && Number(formulario.cantidad) > Number(inv.stockActual || 0)) {
        mostrarError(`No hay piezas suficientes. Stock disponible: ${Number(inv.stockActual || 0)}.`);
        setSaving(false);
        return;
      }
      await crearMovimiento({
        cantidad: Number(formulario.cantidad),
        tipo: formulario.tipo,
        motivo: formulario.motivo,
        inventarioId: Number(inv.idInventario),
        createdBy: session.empleadoId
      });

      // recargar todo en paralelo
      const [cats, mats, invs, movs] = await Promise.all([
        listarCategoriasMaterial(),
        listarMateriales(),
        listarInventarios(),
        listarMovimientos()
      ]);
      setCategorias(cats);
      setMateriales(mats);
      setInventarios(invs);
      setMovimientos(movs);

      setFormulario((f) => ({ ...f, nombreMaterial: "", inventarioId: "", tipo: "Entrada", cantidad: "", motivo: "" }));
      setFormularioAbierto(false);
      mostrarSuccess("Movimiento registrado correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  function abrirNuevo() {
    setError("");
    setSuccess("");
    setMaterialEditando(null);
    setFormularioAbierto(true);
  }

  function abrirEditarMaterial(material) {
    const inv = inventarioParaMaterial(material.idMaterial || material.id);
    setError("");
    setSuccess("");
    setMaterialEditando({ material, inventario: inv || null });
    setFormulario((f) => ({
      ...f,
      nombre: material.nombre || "",
      unidad: material.unidad || "Metros",
      costoUnitario: String(material.costoUnitario ?? ""),
      categoriaMaterialId: material.categoriaMaterialId ? String(material.categoriaMaterialId) : "",
      estado: estadoMaterialParaVista(material.estado),
      stockActual: inv?.stockActual != null ? String(inv.stockActual) : "",
      stockMinimo: inv?.stockMinimo != null ? String(inv.stockMinimo) : "",
      nombreMaterial: f.nombreMaterial
    }));
    setFormularioAbierto(true);
  }

  function cancelarFormulario() {
    setError("");
    setMaterialEditando(null);
    setFormularioAbierto(false);
  }

  return (
    <section className="page-stack">
      {success && (
        <div className="pos-alert success">{success}</div>
      )}

      <div className="inv-tabs">
        <button className={tabActivo === "materiales" ? "inv-tab active" : "inv-tab"} onClick={() => setTabActivo("materiales")} type="button">Materiales</button>
        <button className={tabActivo === "categorias" ? "inv-tab active" : "inv-tab"} onClick={() => setTabActivo("categorias")} type="button">Categorías</button>
        {!soloEmpleado && (
          <button className={tabActivo === "movimientos" ? "inv-tab active" : "inv-tab"} onClick={() => setTabActivo("movimientos")} type="button">Movimientos</button>
        )}
      </div>

      {/* Materiales */}
      {tabActivo === "materiales" && (
        <>
          <div className="inv-toolbar">
            <input
              placeholder="Buscar material por nombre"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              disabled={loading}
            />
            <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} disabled={loading}>
              <option value="">Todos los tipos</option>
              {categorias.map((c) => (
                <option key={c.idCategoriaMaterial || c.id} value={c.idCategoriaMaterial || c.id}>
                  {c.nombre || c.descripcion || c.name}
                </option>
              ))}
            </select>
            {!soloEmpleado && (
              <div className="toolbar-actions">
                <button
                  className="primary-button compact-action-button"
                  onClick={abrirNuevo}
                  type="button"
                  disabled={loading}
                >
                  {tabActivo === "materiales" ? "+ Nuevo Material" : "Registrar Movimiento"}
                </button>
              </div>
            )}
          </div>

          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del Material</th>
                  <th>Unidad</th>
                  <th>Costo Unit.</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {materialesPaginados.map((m) => {
                  const inv = inventarioParaMaterial(m.idMaterial);
                  const stockActual = inv ? Number(inv.stockActual) : null;
                  const stockMin = inv ? Number(inv.stockMinimo) : null;
                  const bajo = inv && stockActual <= stockMin;
                  return (
                    <tr key={m.idMaterial} style={bajo ? { background: "#fff7ed" } : undefined}>
                      <td>{m.idMaterial}</td>
                      <td>
                        {bajo && <span aria-hidden>⚠ </span>}
                        {m.nombre}
                      </td>
                      <td><span className="inv-unit-badge">{m.unidad}</span></td>
                      <td>{money(Number(m.costoUnitario))}</td>
                      <td style={bajo ? { color: "#c2410c", fontWeight: 700 } : undefined}>{stockActual === null || stockActual === undefined ? "—" : stockActual}</td>
                      <td>{stockMin === null || stockMin === undefined ? "—" : stockMin}</td>
                      <td>
                        {inv ? (
                          bajo ? <span className="inv-badge warn">⚠ Reorden</span> : <span className="inv-badge ok">✓ OK</span>
                        ) : (
                          <span className="inv-badge neutral">Sin stock</span>
                        )}
                      </td>
                      <td>
                        {soloEmpleado ? (
                          <span className="muted-action">Solo consulta</span>
                        ) : (
                          <div className="table-actions">
                            <button className="ghost-button" onClick={() => abrirEditarMaterial(m)} type="button">
                              Editar
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          aria-label="Ver auditoria del material"
                          className="audit-toggle"
                          onClick={() => abrirAuditoria(`Material ${m.idMaterial}`, m)}
                          type="button"
                        >
                          ?
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={paginaMateriales}
            pageSize={PAGE_SIZE}
            total={materialesFiltrados.length}
            onPageChange={setPaginaMateriales}
            disabled={loading}
          />

          {!soloEmpleado && formularioAbierto && (
            <div className="modal-overlay" onClick={cancelarFormulario}>
              <div className="modal-card customer-modal" onClick={(event) => event.stopPropagation()}>
              <h2>{materialEditando ? "Editar Material" : "Nuevo Material"}</h2>
              <form onSubmit={guardarMaterial}>
                <label className="pos-field floating">
                  <span>Nombre</span>
                  <input name="nombre" value={formulario.nombre} onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))} type="text" />
                </label>

                <div className="pos-field-row">
                  <label className="pos-field floating">
                    <span>Unidad</span>
                    <select name="unidad" value={formulario.unidad} onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__nueva_unidad__") {
                        setNuevaUnidad({ visible: true, nombre: "" });
                        return;
                      }
                      setFormulario((f) => ({ ...f, unidad: v }));
                    }}>
                      <option>Metros</option>
                      <option>Piezas</option>
                      <option>Litros</option>
                      <option>Kg</option>
                      <option>Rollos</option>
                      {unidadesExtra.map(u => <option key={u} value={u}>{u}</option>)}
                      <option value="__nueva_unidad__">+ Nueva unidad...</option>
                    </select>
                  </label>

                  <label className="pos-field floating">
                    <span>Costo Unitario</span>
                    <input name="costoUnitario" inputMode="decimal" value={formulario.costoUnitario} onChange={(e) => setFormulario((f) => ({ ...f, costoUnitario: e.target.value }))} type="text" />
                  </label>
                </div>

                <div className="pos-field-row">
                  <label className="pos-field floating">
                    <span>Categoría</span>
                    <select
                      value={formulario.categoriaMaterialId}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "__nueva__") {
                          abrirNuevaCategoriaMaterial();
                          setFormulario(f => ({ ...f, categoriaMaterialId: "" }));
                          return;
                        }
                        setFormulario((f) => ({ ...f, categoriaMaterialId: v }));
                      }}
                    >
                      <option value="">Selecciona</option>
                      {categorias.map((c) => (
                        <option key={c.idCategoriaMaterial || c.id} value={c.idCategoriaMaterial || c.id}>{c.nombre || c.descripcion || c.name}</option>
                      ))}
                      <option value="__nueva__">+ Nueva categoría...</option>
                    </select>
                  </label>
                  <label className="pos-field floating">
                    <span>Estado</span>
                    <select value={formulario.estado} onChange={(e) => setFormulario((f) => ({ ...f, estado: e.target.value }))}>
                      <option>Activo</option>
                      <option>Inactivo</option>
                    </select>
                  </label>
                </div>

                <div className="pos-field-row">
                  <label className="pos-field floating">
                    <span>Stock Actual</span>
                    <input type="number" min="0" step="any" value={formulario.stockActual} onChange={e => setFormulario(f => ({ ...f, stockActual: e.target.value }))} />
                  </label>
                  <label className="pos-field floating">
                    <span>Stock Mínimo</span>
                    <input type="number" min="0" step="any" value={formulario.stockMinimo} onChange={e => setFormulario(f => ({ ...f, stockMinimo: e.target.value }))} />
                  </label>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <button className="primary-button" type="submit" disabled={saving}>
                    {saving ? "Guardando..." : materialEditando ? "Guardar Cambios" : "Guardar"}
                  </button>
                  <button className="ghost-button" type="button" onClick={cancelarFormulario}>Cancelar</button>
                </div>
              </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Categorías */}
      {tabActivo === "categorias" && (
        <>
          <div className="inv-toolbar">
            <input
              placeholder="Buscar categoría por nombre o descripción"
              value={buscarCategoria}
              onChange={(e) => setBuscarCategoria(e.target.value)}
              disabled={loading}
            />
            <select
              value={estadoCategoriaFiltro}
              onChange={(e) => setEstadoCategoriaFiltro(e.target.value)}
              disabled={loading}
            >
              <option value="">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
            {!soloEmpleado && (
              <div className="toolbar-actions">
                <button
                  className="primary-button compact-action-button"
                  onClick={abrirNuevaCategoriaMaterial}
                  type="button"
                  disabled={loading}
                >
                  + Nueva Categoría
                </button>
              </div>
            )}
          </div>

          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  {!soloEmpleado && <th>Acciones</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categoriasFiltradas.map((categoria) => (
                  <tr key={categoria.idCategoriaMaterial || categoria.id}>
                    <td>{categoria.idCategoriaMaterial || categoria.id}</td>
                    <td style={{ fontWeight: 700 }}>{categoria.nombre}</td>
                    <td>{categoria.descripcion || "-"}</td>
                    <td>
                      <span className={categoria.estado === "Activo" ? "inv-badge ok" : "inv-badge neutral"}>
                        {categoria.estado || "Activo"}
                      </span>
                    </td>
                    {!soloEmpleado && (
                      <td>
                        <div className="table-actions">
                          <button
                            className="ghost-button"
                            onClick={() => {
                              setNuevaCat({
                                visible: true,
                                editando: categoria,
                                nombre: categoria.nombre || "",
                                descripcion: categoria.descripcion || "",
                                estado: categoria.estado || "Activo"
                              });
                            }}
                            type="button"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    )}
                    <td>
                      <button
                        aria-label="Ver auditoria de la categoría"
                        className="audit-toggle"
                        onClick={() => abrirAuditoria(`Categoría ${categoria.idCategoriaMaterial || categoria.id}`, categoria)}
                        type="button"
                      >
                        ▼
                      </button>
                    </td>
                  </tr>
                ))}
                {categoriasFiltradas.length === 0 && !loading && (
                  <tr>
                    <td colSpan={soloEmpleado ? 5 : 6} style={{ textAlign: "center", color: "#64748b", padding: 24 }}>
                      Sin categorías que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Movimientos */}
      {tabActivo === "movimientos" && (
        <>
          <div className="inv-toolbar">
            <div />
            <div />
            {!soloEmpleado && (
              <div className="toolbar-actions">
                <button
                  className="primary-button compact-action-button"
                  onClick={abrirNuevo}
                  type="button"
                  disabled={loading}
                >
                  Nuevo Movimiento
                </button>
              </div>
            )}
          </div>

          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Motivo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {movimientosPaginados.map((m) => (
                  <tr key={idMovimiento(m)}>
                    <td>{idMovimiento(m)}</td>
                    <td>{m.fecha ? new Date(m.fecha).toLocaleString() : "—"}</td>
                    <td>{m.tipo}</td>
                    <td>{m.cantidad}</td>
                    <td>{m.motivo}</td>
                    <td>
                      <button
                        aria-label="Ver auditoria del movimiento"
                        className="audit-toggle"
                        onClick={() => abrirAuditoria(`Movimiento ${idMovimiento(m)}`, m, [["Inventario", m.inventarioId || "-"]])}
                        type="button"
                      >
                        ▼
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={paginaMovimientos}
            pageSize={MOVEMENTS_PAGE_SIZE}
            total={movimientosFiltrados.length}
            onPageChange={setPaginaMovimientos}
            disabled={loading}
          />

          {!soloEmpleado && formularioAbierto && (
            <div className="modal-overlay" onClick={cancelarFormulario}>
              <div className="modal-card customer-modal" onClick={(event) => event.stopPropagation()}>
              <h2>Registrar Movimiento</h2>
              <form onSubmit={guardarMovimiento}>
                <label className="pos-field floating">
                  <span>Nombre del Material</span>
                  <BuscadorMaterial materiales={materialesActivos} value={formulario.nombreMaterial} onChange={(v) => setFormulario((f) => ({ ...f, nombreMaterial: v }))} />
                </label>

                <div className="pos-field-row">
                  <label className="pos-field floating">
                    <span>Tipo</span>
                    <select value={formulario.tipo} onChange={(e) => setFormulario((f) => ({ ...f, tipo: e.target.value }))}>
                      <option>Entrada</option>
                      <option>Salida</option>
                    </select>
                  </label>

                  <label className="pos-field floating">
                    <span>Cantidad</span>
                    {(() => {
                      const matSeleccionado = materiales.find(m => normalizarTexto(m.nombre) === normalizarTexto((formulario.nombreMaterial || "").trim()));
                      const esPiezas = matSeleccionado && normalizarTexto(matSeleccionado.unidad || "").includes("piez");
                      return (
                        <input
                          inputMode={esPiezas ? "numeric" : "decimal"}
                          type="text"
                          value={formulario.cantidad}
                          onChange={e => setFormulario(f => ({ ...f, cantidad: limpiarCantidadMovimiento(e.target.value) }))}
                        />
                      );
                    })()}
                  </label>
                </div>

                <label className="pos-field floating">
                  <span>Motivo</span>
                  <input type="text" value={formulario.motivo} onChange={(e) => setFormulario((f) => ({ ...f, motivo: e.target.value }))} />
                </label>

                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <button className="primary-button" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
                  <button className="ghost-button" type="button" onClick={cancelarFormulario}>Cancelar</button>
                </div>
              </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal flotante para nueva categoría */}
      {nuevaCat.visible && (
        <div className="modal-overlay" onClick={() => setNuevaCat({
          visible: false, editando: null, nombre: "", descripcion: "", estado: "Activo"
        })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{nuevaCat.editando ? "Editar Categoría" : "Nueva Categoría"}</h2>
            <label className="pos-field floating">
              <span>Nombre</span>
              <input type="text" value={nuevaCat.nombre} onChange={e => setNuevaCat(c => ({ ...c, nombre: e.target.value }))} />
            </label>
            <label className="pos-field floating">
              <span>Descripción</span>
              <input type="text" value={nuevaCat.descripcion} onChange={e => setNuevaCat(c => ({ ...c, descripcion: e.target.value }))} />
            </label>
            <label className="pos-field floating">
              <span>Estado</span>
              <select value={nuevaCat.estado} onChange={e => setNuevaCat(c => ({ ...c, estado: e.target.value }))}>
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setNuevaCat({
                  visible: false, editando: null, nombre: "", descripcion: "", estado: "Activo"
                })}
              >
                Cancelar
              </button>
              <button className="primary-button" type="button" disabled={saving} onClick={guardarNuevaCategoria}>
                {saving ? "Guardando..." : nuevaCat.editando ? "Guardar cambios" : "Guardar categoría"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva unidad */}
      {nuevaUnidad.visible && (
        <div className="modal-overlay" onClick={() => setNuevaUnidad({ visible: false, nombre: "" })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Unidad</h2>
            <label className="pos-field floating">
              <span>Nombre de la unidad</span>
              <input type="text" value={nuevaUnidad.nombre} onChange={e => setNuevaUnidad(u => ({ ...u, nombre: e.target.value }))} />
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
              <button className="ghost-button" type="button" onClick={() => setNuevaUnidad({ visible: false, nombre: "" })}>Cancelar</button>
              <button className="primary-button" type="button" onClick={guardarNuevaUnidad}>Guardar unidad</button>
            </div>
          </div>
        </div>
      )}

      {auditModal && (
        <div className="modal-overlay" onClick={() => setAuditModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{auditModal.titulo}</h2>
            <div className="audit-grid modal-audit-grid">
              {auditModal.items.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value || "-"}</strong>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="primary-button" onClick={() => setAuditModal(null)} type="button">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de error */}
      {modalError && (
        <div className="modal-overlay" onClick={() => setModalError("")}>
          <div className="modal-error-card" onClick={e => e.stopPropagation()}>
            <h2>Error</h2>
            <p className="modal-error-msg">{modalError}</p>
            <button className="primary-button" onClick={() => setModalError("")}>Entendido</button>
          </div>
        </div>
      )}
    </section>
  );
}
