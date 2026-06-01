import { useEffect, useMemo, useState } from "react";
import {
  listarCategoriasMaterial,
  listarMateriales,
  crearMaterial,
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
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function nowLocalDateTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
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

  const [formulario, setFormulario] = useState({
    // materiales
    nombre: "",
    unidad: "Metros",
    costoUnitario: "",
    categoriaMaterialId: "",
    estado: "Disponible",
    // stock
    materialId: "",
    sucursalId: "",
    stockActual: "",
    stockMinimo: "",
    // movimiento
    inventarioId: "",
    tipo: "Entrada",
    cantidad: "",
    motivo: "",
    fecha: nowLocalDateTime()
  });

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
        if (active) setError(err.message || String(err));
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
  async function guardarMaterial(e) {
    e?.preventDefault();
    setError("");
    setSuccess("");
    if (!formulario.nombre || !formulario.costoUnitario || !formulario.categoriaMaterialId) {
      setError("Completa nombre, costo y categoría.");
      return;
    }
    setSaving(true);
    try {
      await crearMaterial({
        nombre: formulario.nombre,
        unidad: formulario.unidad,
        costoUnitario: Number(formulario.costoUnitario),
        categoriaMaterialId: Number(formulario.categoriaMaterialId),
        estado: formulario.estado,
        createdBy: session.empleadoId
      });
      const mats = await listarMateriales();
      setMateriales(mats);
      setFormulario((f) => ({
        ...f,
        nombre: "",
        unidad: "Metros",
        costoUnitario: "",
        categoriaMaterialId: "",
        estado: "Disponible"
      }));
      setSuccess("Material creado correctamente.");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function guardarInventario(e) {
    e?.preventDefault();
    setError("");
    setSuccess("");
    if (!formulario.materialId || !formulario.sucursalId) {
      setError("Selecciona material y sucursal.");
      return;
    }
    setSaving(true);
    try {
      await crearInventario({
        stockActual: Number(formulario.stockActual || 0),
        stockMinimo: Number(formulario.stockMinimo || 0),
        materialId: Number(formulario.materialId),
        sucursalId: Number(formulario.sucursalId),
        createdBy: session.empleadoId
      });
      const invs = await listarInventarios();
      setInventarios(invs);
      setFormulario((f) => ({ ...f, materialId: "", sucursalId: "", stockActual: "", stockMinimo: "" }));
      setSuccess("Inventario registrado correctamente.");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function guardarMovimiento(e) {
    e?.preventDefault();
    setError("");
    setSuccess("");
    if (!formulario.inventarioId || !formulario.cantidad) {
      setError("Selecciona inventario y cantidad.");
      return;
    }
    setSaving(true);
    try {
      await crearMovimiento({
        cantidad: Number(formulario.cantidad),
        fecha: formulario.fecha,
        tipo: formulario.tipo,
        motivo: formulario.motivo,
        inventarioId: Number(formulario.inventarioId),
        createdBy: session.empleadoId
      });
      const movs = await listarMovimientos();
      setMovimientos(movs);
      setFormulario((f) => ({ ...f, inventarioId: "", tipo: "Entrada", cantidad: "", motivo: "", fecha: nowLocalDateTime() }));
      setSuccess("Movimiento registrado correctamente.");
    } catch (err) {
      setError(err.message || String(err));
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
          {tabActivo === "materiales" ? "+ Nuevo Material" : tabActivo === "stock" ? "Registrar Stock" : "Registrar Movimiento"}
        </button>
      </div>

      {(error || success) && (
        <div className={error ? "pos-alert error" : "pos-alert success"}>{error || success}</div>
      )}

      <div className="inv-tabs">
        <button className={tabActivo === "materiales" ? "inv-tab active" : "inv-tab"} onClick={() => setTabActivo("materiales")} type="button">Materiales</button>
        <button className={tabActivo === "stock" ? "inv-tab active" : "inv-tab"} onClick={() => setTabActivo("stock")} type="button">Stock</button>
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
                  <span>Nombre</span>
                  <input name="nombre" value={formulario.nombre} onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))} type="text" />
                </label>

                <div className="pos-field-row">
                  <label className="pos-field floating">
                    <span>Unidad</span>
                    <select name="unidad" value={formulario.unidad} onChange={(e) => setFormulario((f) => ({ ...f, unidad: e.target.value }))}>
                      <option>Metros</option>
                      <option>Piezas</option>
                      <option>Litros</option>
                      <option>Kg</option>
                      <option>Rollos</option>
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
                    <select value={formulario.categoriaMaterialId} onChange={(e) => setFormulario((f) => ({ ...f, categoriaMaterialId: e.target.value }))}>
                      <option value="">Selecciona</option>
                      {categorias.map((c) => (
                        <option key={c.idCategoriaMaterial || c.id} value={c.idCategoriaMaterial || c.id}>{c.nombre || c.descripcion || c.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="pos-field floating">
                    <span>Estado</span>
                    <select value={formulario.estado} onChange={(e) => setFormulario((f) => ({ ...f, estado: e.target.value }))}>
                      <option>Disponible</option>
                      <option>Agotado</option>
                      <option>Descontinuado</option>
                    </select>
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

      {/* Stock */}
      {tabActivo === "stock" && (
        <>
          <div className="inv-toolbar">
            <div style={{ flex: 1 }} />
          </div>

          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Sucursal</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Alerta</th>
                </tr>
              </thead>
              <tbody>
                {inventarios.map((i) => {
                  const mat = materiales.find((m) => Number(m.idMaterial) === Number(i.materialId));
                  const bajo = Number(i.stockActual) <= Number(i.stockMinimo);
                  return (
                    <tr key={i.idInventario || `${i.materialId}-${i.sucursalId}`}>
                      <td>{mat ? mat.nombre : `ID ${i.materialId}`}</td>
                      <td>{sucursales.find((s) => Number(s.idSucursal) === Number(i.sucursalId))?.nombre || `ID ${i.sucursalId}`}</td>
                      <td style={bajo ? { color: "#c2410c", fontWeight: 700 } : undefined}>{i.stockActual}</td>
                      <td>{i.stockMinimo}</td>
                      <td>{bajo ? <span className="inv-badge warn">⚠ Bajo</span> : <span className="inv-badge ok">OK</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {formularioAbierto && (
            <section className="pos-card" style={{ marginTop: 18 }}>
              <h2>Registrar Stock</h2>
              <form onSubmit={guardarInventario}>
                <label className="pos-field floating">
                  <span>Material</span>
                  <select value={formulario.materialId} onChange={(e) => setFormulario((f) => ({ ...f, materialId: e.target.value }))}>
                    <option value="">Selecciona</option>
                    {materiales.map((m) => <option key={m.idMaterial} value={m.idMaterial}>{m.nombre}</option>)}
                  </select>
                </label>

                <label className="pos-field floating">
                  <span>Sucursal</span>
                  <select value={formulario.sucursalId} onChange={(e) => setFormulario((f) => ({ ...f, sucursalId: e.target.value }))}>
                    <option value="">Selecciona</option>
                    {sucursales.map((s) => <option key={s.idSucursal} value={s.idSucursal}>{s.nombre || s.direccion || `Sucursal ${s.idSucursal}`}</option>)}
                  </select>
                </label>

                <div className="pos-field-row">
                  <label className="pos-field floating">
                    <span>Stock Actual</span>
                    <input type="number" value={formulario.stockActual} onChange={(e) => setFormulario((f) => ({ ...f, stockActual: e.target.value }))} />
                  </label>

                  <label className="pos-field floating">
                    <span>Stock Mínimo</span>
                    <input type="number" value={formulario.stockMinimo} onChange={(e) => setFormulario((f) => ({ ...f, stockMinimo: e.target.value }))} />
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
                  <span>Inventario</span>
                  <select value={formulario.inventarioId} onChange={(e) => setFormulario((f) => ({ ...f, inventarioId: e.target.value }))}>
                    <option value="">Selecciona</option>
                    {inventarios.map((i) => (
                      <option key={i.idInventario} value={i.idInventario}>
                        {`Material ID: ${i.materialId} - Sucursal ID: ${i.sucursalId}`}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="pos-field-row">
                  <label className="pos-field floating">
                    <span>Tipo</span>
                    <select value={formulario.tipo} onChange={(e) => setFormulario((f) => ({ ...f, tipo: e.target.value }))}>
                      <option>Entrada</option>
                      <option>Salida</option>
                      <option>Ajuste</option>
                    </select>
                  </label>

                  <label className="pos-field floating">
                    <span>Cantidad</span>
                    <input type="number" value={formulario.cantidad} onChange={(e) => setFormulario((f) => ({ ...f, cantidad: e.target.value }))} />
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
    </section>
  );
}