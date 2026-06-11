import { useEffect, useMemo, useState } from "react";
import {
  listarServicios, crearServicio,
  listarCategoriaServicio, crearCategoriaServicio, actualizarCategoriaServicio,
  listarServiciosMateriales, crearServicioMaterial,
  actualizarServicio, actualizarServicioMaterial, eliminarServicioMaterial
} from "../api/catalogApi.js";
import { listarMateriales } from "../api/inventarioApi.js";
import { listarEmpleados } from "../api/empleadoApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { esEmpleado } from "../auth/permissions.js";
import { Pagination } from "../components/Pagination.jsx";

const PAGE_SIZE = 30;

export function ServiciosPage() {
  const { session } = useAuth();
  const soloEmpleado = esEmpleado(session);
  const [tab, setTab] = useState("servicios");
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [serviciosMateriales, setServiciosMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");
  const [buscar, setBuscar] = useState("");
  const [buscarCategoria, setBuscarCategoria] = useState("");
  const [estadoCategoriaFiltro, setEstadoCategoriaFiltro] = useState("");
  const [paginaServicios, setPaginaServicios] = useState(1);

  const [modalServicio, setModalServicio] = useState(false);
  const [servicioEditando, setServicioEditando] = useState(null);
  const [materialesEditandoServicio, setMaterialesEditandoServicio] = useState([]);
  const [formServicio, setFormServicio] = useState({
    nombre: "", descripcion: "", estado: "Activo", categoriaServicioId: ""
  });

  const [modalMaterial, setModalMaterial] = useState(false);
  const [formMaterial, setFormMaterial] = useState({
    servicioId: "", materialId: "", cantidadUsada: ""
  });

  const [nuevaCat, setNuevaCat] = useState({
    visible: false, editando: null, nombre: "", descripcion: "", estado: "Activo"
  });

  const [updatingEstadoId, setUpdatingEstadoId] = useState(null);
  const [auditModal, setAuditModal] = useState(null);

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
        ["Registro", fechaHora(registro.createdAt)],
        ["Editado por", nombreEmpleado(registro.updatedBy)],
        ["Ultima edicion", fechaHora(registro.updatedAt)],
        ["Eliminado por", nombreEmpleado(registro.deletedBy)],
        ["Eliminacion", fechaHora(registro.deletedAt)],
        ...extra
      ]
    });
  }

  function materialActivo(material) {
    const estado = String(material?.estado || "").toLowerCase();
    return estado === "disponible" || estado === "activo";
  }

  function limpiarCantidadPositiva(value) {
    const limpio = String(value || "").replace(/[+-]/g, "").replace(/[^\d.]/g, "");
    const partes = limpio.split(".");
    return partes.length > 1 ? `${partes[0]}.${partes.slice(1).join("")}` : limpio;
  }

  function normalizarTexto(value) {
    return (value || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  const sucursalActivaId = session?.sucursalIdSucursal || session?.sucursalId;

  function registroDeSucursal(registro) {
    if (!sucursalActivaId) {
      return true;
    }
    const empleado = empleados.find((item) => Number(item.idEmpleado) === Number(registro.createdBy));
    return Number(empleado?.sucursalIdSucursal) === Number(sucursalActivaId);
  }

  function abrirNuevoServicio() {
    setServicioEditando(null);
    setMaterialesEditandoServicio([]);
    setFormServicio({ nombre: "", descripcion: "", estado: "Activo", categoriaServicioId: "" });
    setModalServicio(true);
  }

  function abrirEditarServicio(servicio) {
    const servicioId = Number(servicio.idServicio || servicio.id);
    setServicioEditando(servicio);
    setMaterialesEditandoServicio(
      serviciosMateriales
        .filter(item => Number(item.servicioId) === servicioId)
        .map(item => ({
          idServicioMaterial: item.idServicioMaterial || item.id,
          servicioId,
          materialId: item.materialId ? String(item.materialId) : "",
          cantidadUsada: String(item.cantidadUsada ?? ""),
          createdBy: item.createdBy,
          deleted: false,
          isNew: false
        }))
    );
    setFormServicio({
      nombre: servicio.nombre || "",
      descripcion: servicio.descripcion || "",
      estado: servicio.estado || "Activo",
      categoriaServicioId: servicio.categoriaServicioId ? String(servicio.categoriaServicioId) : ""
    });
    setModalServicio(true);
  }

  function abrirNuevaCategoria() {
    setNuevaCat({ visible: true, editando: null, nombre: "", descripcion: "", estado: "Activo" });
  }

  function agregarMaterialEditandoServicio() {
    setMaterialesEditandoServicio((current) => [
      ...current,
      {
        idServicioMaterial: `nuevo-${crypto.randomUUID()}`,
        servicioId: Number(servicioEditando?.idServicio || servicioEditando?.id),
        materialId: "",
        cantidadUsada: "",
        createdBy: session.empleadoId,
        deleted: false,
        isNew: true
      }
    ]);
  }

  function actualizarMaterialEditandoServicio(id, field, value) {
    setMaterialesEditandoServicio((current) => current.map((item) => {
      if (item.idServicioMaterial !== id) {
        return item;
      }

      return {
        ...item,
        [field]: field === "cantidadUsada" ? limpiarCantidadPositiva(value) : value
      };
    }));
  }

  function quitarMaterialEditandoServicio(id) {
    setMaterialesEditandoServicio((current) => current.map((item) => (
      item.idServicioMaterial === id ? { ...item, deleted: true } : item
    )));
  }

  useEffect(() => {
    let active = true;
    async function cargar() {
      setLoading(true);
      try {
        const [svs, cats, mats, svMats, emps] = await Promise.all([
          listarServicios(),
          listarCategoriaServicio(),
          listarMateriales(),
          listarServiciosMateriales(),
          listarEmpleados()
        ]);
        if (!active) return;
        setServicios(safe(svs));
        setCategorias(safe(cats));
        setMateriales(safe(mats));
        setServiciosMateriales(safe(svMats));
        setEmpleados(safe(emps));
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
    return servicios
      .filter(registroDeSucursal)
      .filter(s => !q ||
        (s.nombre || "").toLowerCase().includes(q) ||
        (s.descripcion || "").toLowerCase().includes(q) ||
        nombreCategoria(s.categoriaServicioId).toLowerCase().includes(q)
      );
  }, [servicios, buscar, categorias, empleados, sucursalActivaId]);

  const serviciosPaginados = useMemo(() => {
    const inicio = (paginaServicios - 1) * PAGE_SIZE;
    return serviciosFiltrados.slice(inicio, inicio + PAGE_SIZE);
  }, [serviciosFiltrados, paginaServicios]);

  const categoriasFiltradas = useMemo(() => {
    const q = normalizarTexto(buscarCategoria.trim());
    return categorias
      .filter(categoria => !estadoCategoriaFiltro || categoria.estado === estadoCategoriaFiltro)
      .filter(categoria => {
        if (!q) return true;
        return normalizarTexto(categoria.nombre).includes(q)
          || normalizarTexto(categoria.descripcion).includes(q);
      });
  }, [categorias, buscarCategoria, estadoCategoriaFiltro]);

  useEffect(() => {
    setPaginaServicios(1);
  }, [buscar, sucursalActivaId]);

  const serviciosDisponibles = useMemo(() => {
    return servicios.filter((servicio) => registroDeSucursal(servicio) && (servicio.estado || "Activo") === "Activo");
  }, [servicios, empleados, sucursalActivaId]);

  const materialesDisponibles = useMemo(() => {
    return materiales.filter((material) => materialActivo(material));
  }, [materiales]);

  async function guardarServicio() {
    if (!formServicio.nombre.trim()) {
      mostrarError("Escribe el nombre del servicio."); return;
    }
    if (!formServicio.categoriaServicioId) {
      mostrarError("Selecciona una categoría."); return;
    }

    // Validación: bloquear nombres duplicados en la misma sucursal
    const nombreNuevo = formServicio.nombre.trim().toLowerCase();
    const duplicado = servicios
      .filter(s => {
        if (servicioEditando) {
          return Number(s.idServicio || s.id) !== Number(servicioEditando.idServicio || servicioEditando.id);
        }
        return true;
      })
      .filter(registroDeSucursal)
      .find(s => (s.nombre || "").trim().toLowerCase() === nombreNuevo);

    if (duplicado) {
      mostrarError(`Ya existe un servicio con el nombre "${formServicio.nombre.trim()}" en esta sucursal.`);
      return;
    }

    setSaving(true);
    try {
      const esEdicion = Boolean(servicioEditando);
      const payload = {
        nombre: formServicio.nombre.trim(),
        descripcion: formServicio.descripcion.trim(),
        estado: formServicio.estado,
        categoriaServicioId: Number(formServicio.categoriaServicioId),
        createdBy: servicioEditando?.createdBy || session.empleadoId,
        updatedBy: esEdicion ? session.empleadoId : null
      };
      if (esEdicion) {
        await actualizarServicio(servicioEditando.idServicio || servicioEditando.id, payload);
        await guardarMaterialesEditandoServicio(servicioEditando.idServicio || servicioEditando.id);
      } else {
        await crearServicio(payload);
      }
      const svs = await listarServicios();
      const svMats = await listarServiciosMateriales();
      setServicios(safe(svs));
      setServiciosMateriales(safe(svMats));
      setModalServicio(false);
      setServicioEditando(null);
      setMaterialesEditandoServicio([]);
      setFormServicio({ nombre: "", descripcion: "", estado: "Activo", categoriaServicioId: "" });
      mostrarSuccess(esEdicion ? "Servicio actualizado correctamente." : "Servicio creado correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function guardarMaterialesEditandoServicio(servicioId) {
    const activos = materialesEditandoServicio.filter(item => !item.deleted);
    const ids = activos.map(item => item.materialId).filter(Boolean);
    if (new Set(ids).size !== ids.length) {
      throw new Error("No puedes repetir el mismo material en un servicio.");
    }

    for (const item of activos) {
      if (!item.materialId) {
        throw new Error("Selecciona el material ligado al servicio.");
      }
      if (!item.cantidadUsada || Number(item.cantidadUsada) <= 0) {
        throw new Error("La cantidad usada del material debe ser mayor a cero.");
      }

      const material = materiales.find((mat) => Number(mat.idMaterial || mat.id) === Number(item.materialId));
      if (!materialActivo(material)) {
        throw new Error("No se puede asignar un material inactivo a un servicio.");
      }
    }

    for (const item of materialesEditandoServicio) {
      if (item.deleted) {
        if (!item.isNew) {
          await eliminarServicioMaterial(item.idServicioMaterial);
        }
        continue;
      }

      const payload = {
        cantidadUsada: Number(item.cantidadUsada),
        servicioId: Number(servicioId),
        materialId: Number(item.materialId),
        createdBy: item.createdBy || session.empleadoId,
        updatedBy: item.isNew ? null : session.empleadoId
      };

      if (item.isNew) {
        await crearServicioMaterial(payload);
      } else {
        await actualizarServicioMaterial(item.idServicioMaterial, payload);
      }
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
    const material = materiales.find((item) => Number(item.idMaterial || item.id) === Number(formMaterial.materialId));
    if (!materialActivo(material)) {
      mostrarError("No se puede asignar un material inactivo a un servicio."); return;
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
    const nombreNormalizado = nuevaCat.nombre.trim().toLowerCase();
    const categoriaDuplicada = categorias.some(categoria => {
      const idCategoria = Number(categoria.idCategoriaServicio || categoria.id);
      const idEditando = nuevaCat.editando
        ? Number(nuevaCat.editando.idCategoriaServicio || nuevaCat.editando.id)
        : null;
      return (categoria.nombre || "").trim().toLowerCase() === nombreNormalizado
        && idCategoria !== idEditando;
    });
    if (categoriaDuplicada) {
      mostrarError("Ya existe una categoría de servicio con ese nombre.");
      return;
    }
    if (nuevaCat.editando && nuevaCat.estado === "Inactivo") {
      const idCategoriaEditando = Number(nuevaCat.editando.idCategoriaServicio || nuevaCat.editando.id);
      const tieneServiciosLigados = servicios.some(servicio =>
        Number(servicio.categoriaServicioId) === idCategoriaEditando && !servicio.deletedAt
      );
      const estabaActiva = (nuevaCat.editando.estado || "Activo") !== "Inactivo";
      if (estabaActiva && tieneServiciosLigados) {
        mostrarError("No se puede inactivar la categoría porque tiene servicios ligados.");
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        nombre: nuevaCat.nombre.trim(),
        descripcion: nuevaCat.descripcion.trim(),
        estado: nuevaCat.estado || "Activo",
        createdBy: nuevaCat.editando?.createdBy || session.empleadoId,
        updatedBy: nuevaCat.editando ? session.empleadoId : null
      };

      if (nuevaCat.editando) {
        await actualizarCategoriaServicio(nuevaCat.editando.idCategoriaServicio || nuevaCat.editando.id, payload);
      } else {
        await crearCategoriaServicio(payload);
      }

      const cats = await listarCategoriaServicio();
      setCategorias(safe(cats));
      const nueva = safe(cats).find(c => c.nombre === nuevaCat.nombre.trim());
      if (nueva) {
        setFormServicio(f => ({
          ...f,
          categoriaServicioId: String(nueva.idCategoriaServicio || nueva.id)
        }));
      }
      setNuevaCat({ visible: false, editando: null, nombre: "", descripcion: "", estado: "Activo" });
      mostrarSuccess(nuevaCat.editando ? "Categoría actualizada." : "Categoría creada.");
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
      const payload = {
        nombre: serv.nombre,
        descripcion: serv.descripcion || "",
        estado: nuevoEstado,
        categoriaServicioId: Number(serv.categoriaServicioId),
        createdBy: serv.createdBy || session.empleadoId,
        updatedBy: session.empleadoId
      };
      console.log("PUT /servicios/", id, payload);
      const res = await actualizarServicio(id, payload);
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
      {success && (
        <div className="pos-alert success">{success}</div>
      )}

      <div className="inv-tabs">
        <button className={tab === "servicios" ? "inv-tab active" : "inv-tab"} onClick={() => setTab("servicios")} type="button">
          Servicios
        </button>
        <button className={tab === "categorias" ? "inv-tab active" : "inv-tab"} onClick={() => setTab("categorias")} type="button">
          Categorías
        </button>
      </div>

      {tab === "servicios" && (
        <div className="inv-toolbar">
          <input
            placeholder="Buscar servicio..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            style={{ flex: 1 }}
            disabled={loading}
          />
          <div />
          <div className="toolbar-actions">
            {!soloEmpleado && (
              <button
                className="primary-button"
                onClick={abrirNuevoServicio}
                type="button"
                disabled={loading}
              >
                + Nuevo Servicio
              </button>
            )}
          </div>
        </div>
      )}

      {tab === "servicios" && (
      <>
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
              {!soloEmpleado && <th>Acciones</th>}
              {!soloEmpleado && <th></th>}
              {!soloEmpleado && <th></th>} {/* acción: agregar material */}
            </tr>
          </thead>
          <tbody>
            {serviciosPaginados.map((s, i) => {
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
                    {soloEmpleado ? (
                      <span style={{
                        padding: "6px 10px", borderRadius: 8, fontWeight: 700,
                        background: s.estado === "Activo" ? "#f1fdf6" : "#fff6f5",
                        color: s.estado === "Activo" ? "#059669" : "#be123c"
                      }}>
                        {s.estado || "Activo"}
                      </span>
                    ) : (
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
                    )}
                  </td>
                  { !soloEmpleado && (
                    <td>
                      <div className="table-actions">
                        <button className="ghost-button" onClick={() => abrirEditarServicio(s)} type="button">
                          Editar
                        </button>
                      </div>
                    </td>
                  )}
                  { !soloEmpleado && (
                    <td>
                      <button
                        aria-label="Ver auditoria del servicio"
                        className="audit-toggle"
                        onClick={() => abrirAuditoria(`Servicio ${s.idServicio || s.id}`, s, [["Cambio de estado", s.estado || "-"]])}
                        type="button"
                      >
                        ▼
                      </button>
                    </td>
                  )}
                  { !soloEmpleado && (
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
                  )}
                 </tr>
              );
            })}
            {serviciosFiltrados.length === 0 && !loading && (
              <tr>
                <td colSpan={9} style={{
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

      <Pagination
        page={paginaServicios}
        pageSize={PAGE_SIZE}
        total={serviciosFiltrados.length}
        onPageChange={setPaginaServicios}
        disabled={loading}
      />
      </>
      )}

      {tab === "categorias" && (
        <>
          <div className="inv-toolbar">
            <input
              placeholder="Buscar categoría por nombre o descripción"
              value={buscarCategoria}
              onChange={e => setBuscarCategoria(e.target.value)}
              disabled={loading}
            />
            <select
              value={estadoCategoriaFiltro}
              onChange={e => setEstadoCategoriaFiltro(e.target.value)}
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
                  onClick={abrirNuevaCategoria}
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
                {categoriasFiltradas.map(categoria => (
                  <tr key={categoria.idCategoriaServicio || categoria.id}>
                    <td>{categoria.idCategoriaServicio || categoria.id}</td>
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
                            onClick={() => setNuevaCat({
                              visible: true,
                              editando: categoria,
                              nombre: categoria.nombre || "",
                              descripcion: categoria.descripcion || "",
                              estado: categoria.estado || "Activo"
                            })}
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
                        onClick={() => abrirAuditoria(`Categoría ${categoria.idCategoriaServicio || categoria.id}`, categoria)}
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

      {modalServicio && (
        <div className="modal-overlay" onClick={() => {
          setModalServicio(false);
          setServicioEditando(null);
        }}>
          <div className="modal-card service-edit-modal" onClick={e => e.stopPropagation()}>
            <h2>{servicioEditando ? "Editar Servicio" : "Nuevo Servicio"}</h2>
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
                    abrirNuevaCategoria();
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
            {servicioEditando && (
              <div className="service-material-editor">
                <div className="tab-section-header">
                  <h3>Materiales usados</h3>
                </div>
                {materialesEditandoServicio.filter(item => !item.deleted).length === 0 && (
                  <>
                    <p className="report-empty">Este servicio no tiene materiales ligados.</p>
                    <button
                      className="ghost-button service-material-add-empty"
                      onClick={agregarMaterialEditandoServicio}
                      type="button"
                    >
                      + Agregar material
                    </button>
                  </>
                )}
                {materialesEditandoServicio.filter(item => !item.deleted).map(item => (
                  <div className="service-material-row" key={item.idServicioMaterial}>
                    <label className="pos-field floating">
                      <span>Material</span>
                      <select
                        value={item.materialId}
                        onChange={e => actualizarMaterialEditandoServicio(
                          item.idServicioMaterial,
                          "materialId",
                          e.target.value
                        )}
                      >
                        <option value="">Selecciona un material</option>
                        {materialesDisponibles.map(material => (
                          <option
                            key={material.idMaterial || material.id}
                            value={material.idMaterial || material.id}
                          >
                            {material.nombre} ({material.unidad})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="pos-field floating">
                      <span>Cantidad usada</span>
                      <input
                        inputMode="decimal"
                        type="text"
                        value={item.cantidadUsada}
                        onChange={e => actualizarMaterialEditandoServicio(
                          item.idServicioMaterial,
                          "cantidadUsada",
                          e.target.value
                        )}
                      />
                    </label>
                    <div className="service-material-actions">
                      <button
                        className="ghost-button"
                        onClick={agregarMaterialEditandoServicio}
                        type="button"
                      >
                        + Agregar material
                      </button>
                      <button
                        className="danger-button service-material-remove"
                        onClick={() => quitarMaterialEditandoServicio(item.idServicioMaterial)}
                        type="button"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                onClick={() => {
                  setModalServicio(false);
                  setServicioEditando(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={saving}
                onClick={guardarServicio}
              >
                {saving ? "Guardando..." : servicioEditando ? "Guardar Cambios" : "Guardar Servicio"}
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
                {materialesDisponibles
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
                inputMode="decimal"
                type="text"
                value={formMaterial.cantidadUsada}
                onChange={e => setFormMaterial(f => ({
                  ...f, cantidadUsada: limpiarCantidadPositiva(e.target.value)
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
          visible: false, editando: null, nombre: "", descripcion: "", estado: "Activo"
        })}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>{nuevaCat.editando ? "Editar Categoría" : "Nueva Categoría"}</h2>
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
            <label className="pos-field floating">
              <span>Estado</span>
              <select
                value={nuevaCat.estado}
                onChange={e => setNuevaCat(c => ({
                  ...c, estado: e.target.value
                }))}
              >
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
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
                  visible: false, editando: null, nombre: "", descripcion: "", estado: "Activo"
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
                {saving ? "Guardando..." : nuevaCat.editando ? "Guardar cambios" : "Guardar categoría"}
              </button>
            </div>
          </div>
        </div>
      )}

      {auditModal && (
        <div className="modal-overlay" onClick={() => setAuditModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
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

      {modalError && (
        <div className="modal-error-overlay" onClick={() => setModalError("")}>
          <div className="modal-error-card" onClick={e => e.stopPropagation()}>
            <h2>Error</h2>
            <p className="modal-error-msg">{modalError}</p>
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
