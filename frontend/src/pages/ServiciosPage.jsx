import { useEffect, useMemo, useState } from "react";
import {
  listarServicios, crearServicio,
  listarCategoriaServicio, crearCategoriaServicio,
  listarServiciosMateriales, crearServicioMaterial,
  actualizarServicio
} from "../api/catalogApi.js";
import { listarMateriales } from "../api/inventarioApi.js";
import { useAuth } from "../auth/AuthContext.jsx";

export function ServiciosPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState("servicios");
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [serviciosMateriales, setServiciosMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");
  const [buscar, setBuscar] = useState("");

  const [modalServicio, setModalServicio] = useState(false);
  const [formServicio, setFormServicio] = useState({
    nombre: "", descripcion: "", estado: "Activo", categoriaServicioId: ""
  });

  const [modalMaterial, setModalMaterial] = useState(false);
  const [formMaterial, setFormMaterial] = useState({
    servicioId: "", materialId: "", cantidadUsada: ""
  });

  const [nuevaCat, setNuevaCat] = useState({
    visible: false, nombre: "", descripcion: ""
  });

  const [updatingEstadoId, setUpdatingEstadoId] = useState(null);

  function mostrarError(msg) { setModalError(msg); }
  function mostrarSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }
  function money(v) {
    return new Intl.NumberFormat("es-MX", {
      currency: "MXN", style: "currency"
    }).format(v || 0);
  }
  function safe(arr) {
    return Array.isArray(arr) ? arr : [arr].filter(Boolean);
  }
  function nombreCategoria(id) {
    const c = categorias.find(c =>
      Number(c.idCategoriaServicio || c.id) === Number(id)
    );
    return c ? c.nombre : "—";
  }
  function nombreServicio(id) {
    const s = servicios.find(s =>
      Number(s.idServicio || s.id) === Number(id)
    );
    return s ? s.nombre : `Servicio ${id}`;
  }
  function nombreMaterial(id) {
    const m = materiales.find(m =>
      Number(m.idMaterial || m.id) === Number(id)
    );
    return m ? m.nombre : `Material ${id}`;
  }

  useEffect(() => {
    let active = true;
    async function cargar() {
      setLoading(true);
      try {
        const [svs, cats, mats, svMats] = await Promise.all([
          listarServicios(),
          listarCategoriaServicio(),
          listarMateriales(),
          listarServiciosMateriales()
        ]);
        if (!active) return;
        setServicios(safe(svs));
        setCategorias(safe(cats));
        setMateriales(safe(mats));
        setServiciosMateriales(safe(svMats));
      } catch (err) {
        if (active) mostrarError(err.message || String(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    cargar();
    return () => { active = false; };
  }, []);

  const serviciosFiltrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return servicios;
    return servicios.filter(s =>
      (s.nombre || "").toLowerCase().includes(q) ||
      (s.descripcion || "").toLowerCase().includes(q) ||
      nombreCategoria(s.categoriaServicioId).toLowerCase().includes(q)
    );
  }, [servicios, buscar, categorias]);

  async function guardarServicio() {
    if (!formServicio.nombre.trim()) {
      mostrarError("Escribe el nombre del servicio."); return;
    }
    if (!formServicio.categoriaServicioId) {
      mostrarError("Selecciona una categoría."); return;
    }
    setSaving(true);
    try {
      await crearServicio({
        nombre: formServicio.nombre.trim(),
        descripcion: formServicio.descripcion.trim(),
        estado: formServicio.estado,
        categoriaServicioId: Number(formServicio.categoriaServicioId),
        createdBy: session.empleadoId
      });
      const svs = await listarServicios();
      setServicios(safe(svs));
      setModalServicio(false);
      setFormServicio({ nombre: "", descripcion: "", estado: "Activo", categoriaServicioId: "" });
      mostrarSuccess("Servicio creado correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function guardarMaterial() {
    if (!formMaterial.servicioId) {
      mostrarError("Selecciona un servicio."); return;
    }
    if (!formMaterial.materialId) {
      mostrarError("Selecciona un material."); return;
    }
    if (!formMaterial.cantidadUsada || Number(formMaterial.cantidadUsada) <= 0) {
      mostrarError("Ingresa una cantidad válida."); return;
    }
    setSaving(true);
    try {
      await crearServicioMaterial({
        cantidadUsada: Number(formMaterial.cantidadUsada),
        servicioId: Number(formMaterial.servicioId),
        materialId: Number(formMaterial.materialId),
        createdBy: session.empleadoId
      });
      const svMats = await listarServiciosMateriales();
      setServiciosMateriales(safe(svMats));
      setModalMaterial(false);
      setFormMaterial({ servicioId: "", materialId: "", cantidadUsada: "" });
      mostrarSuccess("Material asignado correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function guardarNuevaCategoria() {
    if (!nuevaCat.nombre.trim()) {
      mostrarError("Escribe un nombre para la categoría."); return;
    }
    setSaving(true);
    try {
      await crearCategoriaServicio({
        nombre: nuevaCat.nombre.trim(),
        descripcion: nuevaCat.descripcion.trim(),
        estado: "Activo",
        createdBy: session.empleadoId
      });
      const cats = await listarCategoriaServicio();
      setCategorias(safe(cats));
      const nueva = safe(cats).find(c => c.nombre === nuevaCat.nombre.trim());
      if (nueva) {
        setFormServicio(f => ({
          ...f,
          categoriaServicioId: String(nueva.idCategoriaServicio || nueva.id)
        }));
      }
      setNuevaCat({ visible: false, nombre: "", descripcion: "" });
      mostrarSuccess("Categoría creada.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function cambiarEstadoServicio(serv, nuevoEstado) {
    const id = Number(serv.idServicio || serv.id);
    if (!id) return;
    // Optimistic UI update
    const prev = servicios;
    setServicios(prevList => prevList.map(s => (Number(s.idServicio || s.id) === id ? { ...s, estado: nuevoEstado } : s)));
    setUpdatingEstadoId(id);
    try {
      console.log("PUT /servicios/", id, { estado: nuevoEstado, updatedBy: session.empleadoId });
      const res = await actualizarServicio(id, { estado: nuevoEstado, updatedBy: session.empleadoId });
      console.log("respuesta actualizarServicio:", res);
      const svs = await listarServicios();
      setServicios(safe(svs));
      mostrarSuccess("Estado actualizado.");
    } catch (err) {
      console.error("Error al actualizar estado servicio:", err);
      // revertir cambio optimista
      setServicios(prev);
      mostrarError(err.message || String(err));
    } finally {
      setUpdatingEstadoId(null);
    }
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Modulo</span>
          <h1>Servicios</h1>
        </div>
        <button
          className="primary-button"
          onClick={() => tab === "servicios"
            ? setModalServicio(true)
            : setModalMaterial(true)
          }
          type="button"
          disabled={loading}
        >
          {tab === "servicios" ? "+ Nuevo Servicio" : "+ Asignar Material"}
        </button>
      </div>

      {success && (
        <div className="pos-alert success">{success}</div>
      )}

      {/* barra superior: búsqueda */}
      <div className="inv-toolbar">
        <input
          placeholder="Buscar servicio..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          style={{ flex: 1 }}
          disabled={loading}
        />
      </div>

      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Materiales</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th></th> {/* acción: agregar material */}
            </tr>
          </thead>
          <tbody>
            {serviciosFiltrados.map((s, i) => {
              const mats = (serviciosMateriales || [])
                .filter(sm => Number(sm.servicioId) === Number(s.idServicio || s.id));
              return (
                <tr key={s.idServicio || s.id || i}>
                  <td>{s.idServicio || s.id}</td>
                  <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                  <td style={{ color: "#64748b" }}>{s.descripcion || "—"}</td>
                  <td>
                    {mats.length === 0 ? "—" : (
                      <div style={{ margin: 0, paddingLeft: 0 }}>
                        {mats.map((m, idx) => (
                          <div key={m.idServicioMaterial || m.id || idx} style={{ marginBottom: 6 }}>
                            {nombreMaterial(m.materialId)}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{nombreCategoria(s.categoriaServicioId)}</td>
                  <td>
                    <select
                      value={s.estado || "Activo"}
                      onChange={e => cambiarEstadoServicio(s, e.target.value)}
                      disabled={loading || updatingEstadoId === Number(s.idServicio || s.id)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #e6e6e6",
                        background: s.estado === "Activo" ? "#f1fdf6" : "#fff6f5",
                        color: s.estado === "Activo" ? "#059669" : "#be123c",
                        fontWeight: 700
                      }}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => {
                        setFormMaterial({ servicioId: String(s.idServicio || s.id), materialId: "", cantidadUsada: "" });
                        setModalMaterial(true);
                      }}
                      disabled={loading}
                      style={{ padding: "8px 12px", fontSize: 14 }}
                    >
                      + Agregar material
                    </button>
                  </td>
                </tr>
              );
            })}
            {serviciosFiltrados.length === 0 && !loading && (
              <tr>
                <td colSpan={7} style={{
                  textAlign: "center",
                  color: "#64748b",
                  padding: 24
                }}>
                  Sin servicios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalServicio && (
        <div className="modal-overlay" onClick={() => setModalServicio(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>Nuevo Servicio</h2>
            <label className="pos-field floating">
              <span>Nombre</span>
              <input
                type="text"
                value={formServicio.nombre}
                onChange={e => setFormServicio(f => ({
                  ...f, nombre: e.target.value
                }))}
              />
            </label>
            <label className="pos-field floating">
              <span>Descripción</span>
              <input
                type="text"
                value={formServicio.descripcion}
                onChange={e => setFormServicio(f => ({
                  ...f, descripcion: e.target.value
                }))}
              />
            </label>
            <label className="pos-field floating">
              <span>Categoría</span>
              <select
                value={formServicio.categoriaServicioId}
                onChange={e => {
                  if (e.target.value === "__nueva__") {
                    setNuevaCat({ visible: true, nombre: "", descripcion: "" });
                    return;
                  }
                  setFormServicio(f => ({
                    ...f, categoriaServicioId: e.target.value
                  }));
                }}
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map(c => (
                  <option
                    key={c.idCategoriaServicio || c.id}
                    value={c.idCategoriaServicio || c.id}
                  >
                    {c.nombre}
                  </option>
                ))}
                <option value="__nueva__">+ Nueva categoría...</option>
              </select>
            </label>
            {/* El estado ya no se selecciona al crear: por defecto será "Activo" */}
            {/* <label className="pos-field floating">
              <span>Estado</span>
              <select
                value={formServicio.estado}
                onChange={e => setFormServicio(f => ({
                  ...f, estado: e.target.value
                }))}
              >
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </label> */}
            <div style={{
              display: "flex", justifyContent: "flex-end",
              gap: 12, marginTop: 20
            }}>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setModalServicio(false)}
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={saving}
                onClick={guardarServicio}
              >
                {saving ? "Guardando..." : "Guardar Servicio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMaterial && (
        <div className="modal-overlay" onClick={() => setModalMaterial(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>Asignar Material a Servicio</h2>
            <label className="pos-field floating">
              <span>Servicio</span>
              <select
                value={formMaterial.servicioId}
                onChange={e => setFormMaterial(f => ({
                  ...f, servicioId: e.target.value
                }))}
              >
                <option value="">Selecciona un servicio</option>
                {serviciosDisponibles.map(s => (
                  <option key={s.idServicio || s.id} value={s.idServicio || s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="pos-field floating">
              <span>Material</span>
              <select
                value={formMaterial.materialId}
                onChange={e => setFormMaterial(f => ({
                  ...f, materialId: e.target.value
                }))}
              >
                <option value="">Selecciona un material</option>
                {materiales
                  .filter(m => String(m.estado || "").toLowerCase() === "activo")
                  .map(m => (
                    <option key={m.idMaterial || m.id} value={m.idMaterial || m.id}>
                      {m.nombre} ({m.unidad})
                    </option>
                ))}
              </select>
            </label>
            <label className="pos-field floating">
              <span>Cantidad Usada</span>
              <input
                type="number"
                min="0"
                step="any"
                value={formMaterial.cantidadUsada}
                onChange={e => setFormMaterial(f => ({
                  ...f, cantidadUsada: e.target.value
                }))}
              />
            </label>
            <div style={{
              display: "flex", justifyContent: "flex-end",
              gap: 12, marginTop: 20
            }}>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setModalMaterial(false)}
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={saving}
                onClick={guardarMaterial}
              >
                {saving ? "Guardando..." : "Asignar Material"}
              </button>
            </div>
          </div>
        </div>
      )}

      {nuevaCat.visible && (
        <div className="modal-overlay" onClick={() => setNuevaCat({
          visible: false, nombre: "", descripcion: ""
        })}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>Nueva Categoría</h2>
            <label className="pos-field floating">
              <span>Nombre</span>
              <input
                type="text"
                value={nuevaCat.nombre}
                onChange={e => setNuevaCat(c => ({
                  ...c, nombre: e.target.value
                }))}
              />
            </label>
            <label className="pos-field floating">
              <span>Descripción</span>
              <input
                type="text"
                value={nuevaCat.descripcion}
                onChange={e => setNuevaCat(c => ({
                  ...c, descripcion: e.target.value
                }))}
              />
            </label>
            <div style={{
              display: "flex", justifyContent: "flex-end",
              gap: 12,

              marginTop: 20
            }}>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setNuevaCat({
                  visible: false, nombre: "", descripcion: ""
                })}
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={saving}
                onClick={guardarNuevaCategoria}
              >
                {saving ? "Guardando..." : "Guardar categoría"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalError && (
        <div className="modal-error-overlay" onClick={() => setModalError("")}>
          <div className="modal-error-card" onClick={e => e.stopPropagation()}>
            <h2>Error</h2>
            <p style={{ color: "#dc2626" }}>{modalError}</p>
            <button
              className="primary-button"
              type="button"
              onClick={() => setModalError("")}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}