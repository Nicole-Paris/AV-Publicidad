import { useEffect, useMemo, useState, useRef } from "react";
import {
  listarCategoriasMaterial,
  listarMateriales,
  crearMaterial,
  crearCategoriaMaterial,
  listarInventarios,
  crearInventario,
  listarMovimientos,
  crearMovimiento
} from "../api/inventarioApi.js";
import { listarSucursales } from "../api/catalogApi.js";
import { useAuth } from "../auth/AuthContext.jsx";

const CURRENCY = new Intl.NumberFormat("es-MX", { currency: "MXN", style: "currency" });

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
  const [sucursales, setSucursales] = useState([]);

  const [buscar, setBuscar] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  const [nuevaCat, setNuevaCat] = useState({ visible: false, nombre: "", descripcion: "" });

  // modal error
  const [modalError, setModalError] = useState("");

  // nueva unidad
  const [nuevaUnidad, setNuevaUnidad] = useState({ visible: false, nombre: "" });
  const [unidadesExtra, setUnidadesExtra] = useState([]);

  const [formulario, setFormulario] = useState({
    // materiales
    sucursalId: "",
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
        const [cats, mats, invs, movs, sucs] = await Promise.all([
          listarCategoriasMaterial(),
          listarMateriales(),
          listarInventarios(),
          listarMovimientos(),
          listarSucursales()
        ]);
        if (!active) return;
        setCategorias(cats);
        setMateriales(mats);
        setInventarios(invs);
        setMovimientos(movs);
        setSucursales(sucs);
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
      .filter((m) => (!categoriaFiltro || String(m.categoriaMaterialId) === String(categoriaFiltro)))
      .filter((m) => (!q || normalizarTexto(m.nombre).includes(q)));
  }, [materiales, buscar, categoriaFiltro]);

  // helpers para buscar inventario por material (primera coincidencia)
  function inventarioParaMaterial(materialId) {
    return inventarios.find((i) => Number(i.materialId) === Number(materialId));
  }

  // acciones de guardado
  async function guardarNuevaCategoria() {
    if (!nuevaCat.nombre.trim()) {
      mostrarError("Escribe un nombre para la categoría.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const creada = await crearCategoriaMaterial({
        nombre: nuevaCat.nombre.trim(),
        descripcion: nuevaCat.descripcion.trim(),
        estado: "Activo",
        createdBy: session.empleadoId
      });
      const cats = await listarCategoriasMaterial();
      setCategorias(cats);
      // seleccionar automáticamente la categoría recién creada
      const nueva = cats.find(c => (c.nombre || "").trim() === nuevaCat.nombre.trim());
      if (nueva) setFormulario(f => ({ ...f, categoriaMaterialId: nueva.idCategoriaMaterial || nueva.id }));
      setNuevaCat({ visible: false, nombre: "", descripcion: "" });
      mostrarSuccess("Categoría creada y seleccionada.");
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
    if (!formulario.sucursalId) {
      mostrarError("Selecciona una sucursal.");
      return;
    }
    if (!formulario.nombre || !formulario.costoUnitario || !formulario.categoriaMaterialId) {
      mostrarError("Completa nombre, costo y categoría.");
      return;
    }
    setSaving(true);
    try {
      const creada = await crearMaterial({
        nombre: formulario.nombre,
        unidad: formulario.unidad,
        costoUnitario: Number(formulario.costoUnitario),
        categoriaMaterialId: Number(formulario.categoriaMaterialId),
        estado: estadoMaterialParaBackend(formulario.estado),
        sucursalId: Number(formulario.sucursalId),
        createdBy: session.empleadoId
      });

      // crear inventario inicial para el material recién creado
      const idMaterialNuevo = creada.idMaterial || creada.id;
      if (idMaterialNuevo) {
        await crearInventario({
          stockActual: Number(formulario.stockActual || 0),
          stockMinimo: Number(formulario.stockMinimo || 0),
          materialId: Number(idMaterialNuevo),
          sucursalId: Number(formulario.sucursalId),
          createdBy: session.empleadoId
        });
      }

      // recargar todo en paralelo
      const [cats, mats, invs, movs, sucs] = await Promise.all([
        listarCategoriasMaterial(),
        listarMateriales(),
        listarInventarios(),
        listarMovimientos(),
        listarSucursales()
      ]);
      setCategorias(cats);
      setMateriales(mats);
      setInventarios(invs);
      setMovimientos(movs);
      setSucursales(sucs);

      // limpiar y cerrar
      setFormulario((f) => ({
        ...f,
        sucursalId: "",
        nombre: "",
        unidad: "Metros",
        costoUnitario: "",
        categoriaMaterialId: "",
        estado: "Activo",
        nombreMaterial: "",
        stockActual: "",
        stockMinimo: ""
      }));
      setFormularioAbierto(false);
      mostrarSuccess("Material creado correctamente.");
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
    if (!formulario.nombreMaterial || !formulario.cantidad || !formulario.sucursalId) {
      mostrarError("Selecciona material, sucursal y cantidad.");
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
          Number(i.sucursalId) === Number(formulario.sucursalId)
      );
      if (!inv) {
        mostrarError("No hay inventario registrado para ese material en esa sucursal.");
        setSaving(false);
        return;
      }
      await crearMovimiento({
        cantidad: Number(formulario.cantidad),
        fecha: formulario.fecha,
        tipo: formulario.tipo,
        motivo: formulario.motivo,
        inventarioId: Number(inv.idInventario),
        createdBy: session.empleadoId
      });

      // recargar todo en paralelo
      const [cats, mats, invs, movs, sucs] = await Promise.all([
        listarCategoriasMaterial(),
        listarMateriales(),
        listarInventarios(),
        listarMovimientos(),
        listarSucursales()
      ]);
      setCategorias(cats);
      setMateriales(mats);
      setInventarios(invs);
      setMovimientos(movs);
      setSucursales(sucs);

      setFormulario((f) => ({ ...f, nombreMaterial: "", inventarioId: "", tipo: "Entrada", cantidad: "", motivo: "", fecha: nowLocalDateTime(), sucursalId: "" }));
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
    setFormularioAbierto(true);
  }

  function cancelarFormulario() {
    setError("");
    setFormularioAbierto(false);
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Modulo</span>
          <h1>Inventario</h1>
        </div>
        <button
          className="primary-button"
          onClick={abrirNuevo}
          type="button"
          disabled={loading}
        >
          {tabActivo === "materiales" ? "+ Nuevo Material" : "Registrar Movimiento"}
        </button>
      </div>

      {success && (
        <div className="pos-alert success">{success}</div>
      )}

      <div className="inv-tabs">
        <button className={tabActivo === "materiales" ? "inv-tab active" : "inv-tab"} onClick={() => setTabActivo("materiales")} type="button">Materiales</button>
        <button className={tabActivo === "movimientos" ? "inv-tab active" : "inv-tab"} onClick={() => setTabActivo("movimientos")} type="button">Movimientos</button>
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
            <div style={{ flex: 1 }} />
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
                </tr>
              </thead>
              <tbody>
                {materialesFiltrados.map((m) => {
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {formularioAbierto && (
            <section className="pos-card" style={{ marginTop: 18 }}>
              <h2>Nuevo Material</h2>
              <form onSubmit={guardarMaterial}>
                <label className="pos-field floating">
                  <span>Sucursal</span>
                  <select value={formulario.sucursalId} onChange={(e) => setFormulario((f) => ({ ...f, sucursalId: e.target.value }))}>
                    <option value="">Selecciona</option>
                    {sucursales.map((s) => <option key={s.idSucursal} value={s.idSucursal}>{s.nombre}</option>)}
                  </select>
                </label>

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
                          setNuevaCat(c => ({ ...c, visible: true }));
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
                  <button className="primary-button" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
                  <button className="ghost-button" type="button" onClick={cancelarFormulario}>Cancelar</button>
                </div>
              </form>
            </section>
          )}
        </>
      )}

      {/* Movimientos */}
      {tabActivo === "movimientos" && (
        <>
          <div className="inv-toolbar">
            <div style={{ flex: 1 }} />
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
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.idMovimiento || m.id}>
                    <td>{m.idMovimiento || m.id}</td>
                    <td>{m.fecha ? new Date(m.fecha).toLocaleString() : "—"}</td>
                    <td>{m.tipo}</td>
                    <td>{m.cantidad}</td>
                    <td>{m.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {formularioAbierto && (
            <section className="pos-card" style={{ marginTop: 18 }}>
              <h2>Registrar Movimiento</h2>
              <form onSubmit={guardarMovimiento}>
                <label className="pos-field floating">
                  <span>Nombre del Material</span>
                  <BuscadorMaterial materiales={materiales} value={formulario.nombreMaterial} onChange={(v) => setFormulario((f) => ({ ...f, nombreMaterial: v }))} />
                </label>

                <label className="pos-field floating">
                  <span>Sucursal</span>
                  <select value={formulario.sucursalId} onChange={(e) => setFormulario((f) => ({ ...f, sucursalId: e.target.value }))}>
                    <option value="">Selecciona</option>
                    {sucursales.map((s) => <option key={s.idSucursal} value={s.idSucursal}>{s.nombre}</option>)}
                  </select>
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
                          type="number"
                          min="0"
                          step={esPiezas ? "1" : "any"}
                          value={formulario.cantidad}
                          onChange={e => setFormulario(f => ({ ...f, cantidad: e.target.value }))}
                        />
                      );
                    })()}
                  </label>
                </div>

                <label className="pos-field floating">
                  <span>Motivo</span>
                  <input type="text" value={formulario.motivo} onChange={(e) => setFormulario((f) => ({ ...f, motivo: e.target.value }))} />
                </label>

                <label className="pos-field floating">
                  <span>Fecha</span>
                  <input type="datetime-local" value={formulario.fecha} onChange={(e) => setFormulario((f) => ({ ...f, fecha: e.target.value }))} />
                </label>

                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <button className="primary-button" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
                  <button className="ghost-button" type="button" onClick={cancelarFormulario}>Cancelar</button>
                </div>
              </form>
            </section>
          )}
        </>
      )}

      {/* Modal flotante para nueva categoría */}
      {nuevaCat.visible && (
        <div className="modal-overlay" onClick={() => setNuevaCat({ visible: false, nombre: "", descripcion: "" })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Categoría</h2>
            <label className="pos-field floating">
              <span>Nombre</span>
              <input type="text" value={nuevaCat.nombre} onChange={e => setNuevaCat(c => ({ ...c, nombre: e.target.value }))} />
            </label>
            <label className="pos-field floating">
              <span>Descripción</span>
              <input type="text" value={nuevaCat.descripcion} onChange={e => setNuevaCat(c => ({ ...c, descripcion: e.target.value }))} />
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
              <button className="ghost-button" type="button" onClick={() => setNuevaCat({ visible: false, nombre: "", descripcion: "" })}>Cancelar</button>
              <button className="primary-button" type="button" disabled={saving} onClick={guardarNuevaCategoria}>{saving ? "Guardando..." : "Guardar categoría"}</button>
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

      {/* Modal de error */}
      {modalError && (
        <div className="modal-overlay" onClick={() => setModalError("")}>
          <div className="modal-error-card" onClick={e => e.stopPropagation()}>
            <p className="modal-error-icon">⚠</p>
            <p className="modal-error-msg">{modalError}</p>
            <button className="primary-button" onClick={() => setModalError("")}>Entendido</button>
          </div>
        </div>
      )}
    </section>
  );
}
