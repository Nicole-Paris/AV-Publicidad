import { useEffect, useState } from "react";
import {
  listarSucursales, crearSucursal,
  listarGlobalValues, crearGlobalValue,
  actualizarGlobalValue
} from "../api/configuracionApi.js";
import {
  actualizarEmpleado,
  crearEmpleado,
  eliminarEmpleado,
  listarEmpleados,
  listarRoles,
  crearRol
} from "../api/empleadoApi.js";
import { useAuth } from "../auth/AuthContext.jsx";

export function ConfiguracionPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState("empresa");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");
  const [sucursales, setSucursales] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [globalValues, setGlobalValues] = useState([]);
  const [modalSucursal, setModalSucursal] = useState(false);
  const [modalEmpleado, setModalEmpleado] = useState(false);
  const [modalRol, setModalRol] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [empleadoExpandido, setEmpleadoExpandido] = useState(null);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [formSucursal, setFormSucursal] = useState({
    nombre: "", direccion: "", codigoPostal: "",
    telefono: "", horario: ""
  });
  const [formEmpleado, setFormEmpleado] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    correo: "",
    contrasena: "",
    horaEntrada: "09:00",
    horaSalida: "18:00",
    rolId: "",
    sucursalIdSucursal: ""
  });
  const [formRol, setFormRol] = useState({
    nombre: "",
    descripcion: ""
  });
  const [formEmpresa, setFormEmpresa] = useState({
    nombreEmpresa: "", razonSocial: "", rfc: "",
    regimenFiscal: "", direccionFiscal: "",
    telefono: "", correo: "",
    logoUrl: ""
  });

  function mostrarError(msg) { setModalError(msg); }
  function mostrarSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }
  function safe(arr) {
    return Array.isArray(arr) ? arr : [arr].filter(Boolean);
  }
  function getValor(nombre) {
    const gv = globalValues.find(g => g.nombre === nombre);
    return gv ? gv.valor : "";
  }

  function nombreEmpleado(empleado) {
    return [empleado?.nombre, empleado?.apellidoPaterno, empleado?.apellidoMaterno]
      .filter(Boolean)
      .join(" ");
  }

  function nombreRol(id) {
    const rol = roles.find(item => Number(item.idRol || item.id) === Number(id));
    return rol ? rol.nombre : `Rol ${id || "-"}`;
  }

  function nombreSucursal(id) {
    const sucursal = sucursales.find(item => Number(item.idSucursal || item.id) === Number(id));
    return sucursal ? sucursal.nombre : `Sucursal ${id || "-"}`;
  }

  function nombreEmpleadoPorId(id) {
    const empleado = empleados.find(item => Number(item.idEmpleado) === Number(id));
    if (!id) return "-";
    return empleado ? nombreEmpleado(empleado) : `Empleado ${id}`;
  }

  function fechaHora(value) {
    return value ? new Date(value).toLocaleString("es-MX") : "-";
  }

  function empleadosDeSucursal(sucursalId) {
    return empleados.filter(empleado => Number(empleado.sucursalIdSucursal) === Number(sucursalId));
  }

  function abrirSucursal(sucursal) {
    setSucursalSeleccionada(sucursal);
    setEmpleadoExpandido(null);
  }

  function abrirNuevoEmpleado(sucursal = sucursalSeleccionada) {
    setEmpleadoEditando(null);
    setFormEmpleado(f => ({
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      telefono: "",
      correo: "",
      contrasena: "",
      horaEntrada: "09:00",
      horaSalida: "18:00",
      rolId: "",
      sucursalIdSucursal: sucursal ? String(sucursal.idSucursal || sucursal.id) : f.sucursalIdSucursal
    }));
    setModalEmpleado(true);
  }

  function abrirEditarEmpleado(empleado) {
    setEmpleadoEditando(empleado);
    setFormEmpleado({
      nombre: empleado.nombre || "",
      apellidoPaterno: empleado.apellidoPaterno || "",
      apellidoMaterno: empleado.apellidoMaterno || "",
      telefono: empleado.telefono || "",
      correo: empleado.correo || "",
      contrasena: empleado.contrasena || "",
      horaEntrada: empleado.horaEntrada?.slice(0, 5) || "09:00",
      horaSalida: empleado.horaSalida?.slice(0, 5) || "18:00",
      rolId: empleado.rolId ? String(empleado.rolId) : "",
      sucursalIdSucursal: empleado.sucursalIdSucursal ? String(empleado.sucursalIdSucursal) : ""
    });
    setModalEmpleado(true);
  }

  useEffect(() => {
    let active = true;
    async function cargar() {
      setLoading(true);
      try {
        const [sucs, gvs, emps, rolesData] = await Promise.all([
          listarSucursales(),
          listarGlobalValues(),
          listarEmpleados(),
          listarRoles()
        ]);
        if (!active) return;
        setSucursales(safe(sucs));
        setEmpleados(safe(emps));
        setRoles(safe(rolesData));
        const gvsArr = safe(gvs);
        setGlobalValues(gvsArr);
        setFormEmpresa({
          nombreEmpresa: gvsArr.find(g => g.nombre === "nombreEmpresa")?.valor || "",
          razonSocial: gvsArr.find(g => g.nombre === "razonSocial")?.valor || "",
          rfc: gvsArr.find(g => g.nombre === "rfc")?.valor || "",
          regimenFiscal: gvsArr.find(g => g.nombre === "regimenFiscal")?.valor || "",
          direccionFiscal: gvsArr.find(g => g.nombre === "direccionFiscal")?.valor || "",
          telefono: gvsArr.find(g => g.nombre === "telefono")?.valor || "",
          correo: gvsArr.find(g => g.nombre === "correo")?.valor || "",
          // si no hay valor en globalValues, tomar el logo guardado en localStorage (vincula con AppLayout)
          logoUrl: gvsArr.find(g => g.nombre === "logoUrl")?.valor || localStorage.getItem("av_logo_url") || ""
        });
      } catch (err) {
        if (active) mostrarError(err.message || String(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    cargar();
    return () => { active = false; };
  }, []);

  async function guardarEmpresa() {
    setSaving(true);
    try {
      // Guardar solo campos (no logoUrl) que tengan valor no vacío
      const camposConValor = Object.entries(formEmpresa).filter(
        ([nombre, valor]) =>
          nombre !== "logoUrl" &&
          valor &&
          valor.toString().trim() !== ""
      );

      if (camposConValor.length === 0) {
        mostrarSuccess("No hay datos que guardar.");
        setSaving(false);
        return;
      }

      for (const [nombre, valor] of camposConValor) {
        const existente = globalValues.find(g => g.nombre === nombre);
        if (existente) {
          const id = existente.idGlobalValue || existente.id;
          await actualizarGlobalValue(id, {
            tipo: existente.tipo || "empresa",
            nombre,
            valor: valor.toString().trim(),
            updatedBy: session.empleadoId
          });
        } else {
          await crearGlobalValue({
            tipo: "empresa",
            nombre,
            valor: valor.toString().trim(),
            createdBy: session.empleadoId
          });
        }
      }

      // Refrescar valores desde backend
      const gvsRefreshed = await listarGlobalValues();
      const gvsArr = safe(gvsRefreshed);
      setGlobalValues(gvsArr);
      setFormEmpresa(f => ({
        ...f,
        nombreEmpresa: gvsArr.find(g => g.nombre === "nombreEmpresa")?.valor || f.nombreEmpresa,
        razonSocial: gvsArr.find(g => g.nombre === "razonSocial")?.valor || f.razonSocial,
        rfc: gvsArr.find(g => g.nombre === "rfc")?.valor || f.rfc,
        regimenFiscal: gvsArr.find(g => g.nombre === "regimenFiscal")?.valor || f.regimenFiscal,
        direccionFiscal: gvsArr.find(g => g.nombre === "direccionFiscal")?.valor || f.direccionFiscal,
        telefono: gvsArr.find(g => g.nombre === "telefono")?.valor || f.telefono,
        correo: gvsArr.find(g => g.nombre === "correo")?.valor || f.correo,
        logoUrl: gvsArr.find(g => g.nombre === "logoUrl")?.valor || localStorage.getItem("av_logo_url") || f.logoUrl
      }));

      mostrarSuccess("Datos guardados correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function guardarSucursal() {
    if (!formSucursal.nombre.trim()) {
      mostrarError("Escribe el nombre de la sucursal."); return;
    }
    if (!formSucursal.direccion.trim()) {
      mostrarError("Escribe la dirección."); return;
    }
    const cp = (formSucursal.codigoPostal || "").trim();
    const tel = (formSucursal.telefono || "").trim();
    if (!/^\d{5}$/.test(cp)) {
      mostrarError("El código postal debe tener 5 dígitos numéricos."); return;
    }
    if (!/^\d{10}$/.test(tel)) {
      mostrarError("El teléfono debe tener 10 dígitos numéricos."); return;
    }
    setSaving(true);
    try {
      await crearSucursal({
        nombre: formSucursal.nombre.trim(),
        direccion: formSucursal.direccion.trim(),
        codigoPostal: formSucursal.codigoPostal.trim(),
        telefono: formSucursal.telefono.trim(),
        horario: formSucursal.horario.trim(),
        createdBy: session.empleadoId
      });
      const sucs = await listarSucursales();
      setSucursales(safe(sucs));
      setModalSucursal(false);
      setFormSucursal({
        nombre: "", direccion: "", codigoPostal: "",
        telefono: "", horario: ""
      });
      mostrarSuccess("Sucursal creada correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function guardarEmpleado() {
    if (!formEmpleado.nombre.trim()) {
      mostrarError("Escribe el nombre del empleado."); return;
    }
    if (!formEmpleado.apellidoPaterno.trim()) {
      mostrarError("Escribe el apellido paterno."); return;
    }
    if (!formEmpleado.telefono.trim()) {
      mostrarError("Escribe el telefono."); return;
    }
    if (!formEmpleado.correo.trim()) {
      mostrarError("Escribe el correo."); return;
    }
    if (!formEmpleado.contrasena.trim()) {
      mostrarError("Escribe la contrasena."); return;
    }
    if (!formEmpleado.rolId) {
      mostrarError("Selecciona un rol."); return;
    }
    if (!formEmpleado.sucursalIdSucursal) {
      mostrarError("Selecciona una sucursal."); return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: formEmpleado.nombre.trim(),
        apellidoPaterno: formEmpleado.apellidoPaterno.trim(),
        apellidoMaterno: formEmpleado.apellidoMaterno.trim(),
        telefono: formEmpleado.telefono.trim(),
        correo: formEmpleado.correo.trim(),
        contrasena: formEmpleado.contrasena,
        horaEntrada: `${formEmpleado.horaEntrada}:00`,
        horaSalida: `${formEmpleado.horaSalida}:00`,
        rolId: Number(formEmpleado.rolId),
        sucursalIdSucursal: Number(formEmpleado.sucursalIdSucursal)
      };

      if (empleadoEditando) {
        await actualizarEmpleado(empleadoEditando.idEmpleado, payload);
      } else {
        await crearEmpleado(payload);
      }

      const emps = await listarEmpleados();
      setEmpleados(safe(emps));
      setModalEmpleado(false);
      setEmpleadoEditando(null);
      setSucursalSeleccionada(current => current ? { ...current } : current);
      setFormEmpleado({
        nombre: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        telefono: "",
        correo: "",
        contrasena: "",
        horaEntrada: "09:00",
        horaSalida: "18:00",
        rolId: "",
        sucursalIdSucursal: ""
      });
      mostrarSuccess(empleadoEditando ? "Empleado actualizado correctamente." : "Empleado creado correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function borrarEmpleado(empleado) {
    const confirmar = window.confirm(`¿Eliminar a ${nombreEmpleado(empleado)}?`);
    if (!confirmar) return;

    setSaving(true);
    try {
      await eliminarEmpleado(empleado.idEmpleado);
      const emps = await listarEmpleados();
      setEmpleados(safe(emps));
      setEmpleadoExpandido(null);
      setSucursalSeleccionada(current => current ? { ...current } : current);
      mostrarSuccess("Empleado eliminado correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function guardarRol() {
    if (!formRol.nombre.trim()) {
      mostrarError("Escribe el nombre del rol."); return;
    }
    if (!formRol.descripcion.trim()) {
      mostrarError("Escribe la descripcion del rol."); return;
    }

    setSaving(true);
    try {
      const nuevoRol = await crearRol({
        nombre: formRol.nombre.trim(),
        descripcion: formRol.descripcion.trim(),
        createdBy: session.empleadoId
      });
      const rolesActualizados = await listarRoles();
      setRoles(safe(rolesActualizados));
      const rolId = nuevoRol.idRol || nuevoRol.id || safe(rolesActualizados)
        .find(rol => rol.nombre === formRol.nombre.trim())?.idRol;
      if (rolId) {
        setFormEmpleado(f => ({ ...f, rolId: String(rolId) }));
      }
      setFormRol({ nombre: "", descripcion: "" });
      setModalRol(false);
      mostrarSuccess("Rol creado correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function guardarSoloLogo() {
    if (!formEmpresa.logoUrl || !formEmpresa.logoUrl.toString().trim()) {
      mostrarError("Escribe una URL de logotipo válida.");
      return;
    }
    setSaving(true);
    try {
      const nombre = "logoUrl";
      const valor = formEmpresa.logoUrl.toString().trim();
      const existente = globalValues.find(g => g.nombre === nombre);
      if (existente) {
        const id = existente.idGlobalValue || existente.id;
        await actualizarGlobalValue(id, {
          tipo: "empresa",
          nombre,
          valor,
          updatedBy: session.empleadoId
        });
      } else {
        await crearGlobalValue({
          tipo: "empresa",
          nombre,
          valor,
          createdBy: session.empleadoId
        });
      }
      localStorage.setItem("av_logo_url", valor);
      window.dispatchEvent(new Event("av_logo_changed"));
      mostrarSuccess("Logo actualizado correctamente.");
      // refrescar globalValues localmente
      const gvsRefreshed = await listarGlobalValues();
      const gvsArr = safe(gvsRefreshed);
      setGlobalValues(gvsArr);
      setFormEmpresa(f => ({ ...f, logoUrl: gvsArr.find(g => g.nombre === "logoUrl")?.valor || valor }));
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-stack">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Configuración</h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {tab === "sucursales" && (
            <button
              className="primary-button"
              type="button"
              onClick={() => setModalSucursal(true)}
            >
              + Nueva Sucursal
            </button>
          )}
        </div>
      </div>

      {success && <div className="pos-alert success">{success}</div>}

      <div className="inv-tabs">
        <button
          className={tab === "empresa" ? "inv-tab active" : "inv-tab"}
          onClick={() => setTab("empresa")}
          type="button"
        >
          Datos de Empresa
        </button>
        <button
          className={tab === "sucursales" ? "inv-tab active" : "inv-tab"}
          onClick={() => setTab("sucursales")}
          type="button"
        >
          Sucursales
        </button>
      </div>

      {tab === "empresa" && (
        <div style={{display:"grid", gridTemplateColumns:"1fr 320px", gap:24, alignItems:"start"}}>
          <section className="pos-card">
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24}}>
              <h2 style={{margin:0}}>Datos Fiscales</h2>
            </div>

            <div className="pos-field-row">
              <label className="pos-field floating">
                <span>Nombre de la Empresa</span>
                <input
                  type="text"
                  value={formEmpresa.nombreEmpresa}
                  onChange={e => setFormEmpresa(f => ({...f, nombreEmpresa: e.target.value}))}
                />
              </label>
              <label className="pos-field floating">
                <span>Razón Social</span>
                <input
                  type="text"
                  value={formEmpresa.razonSocial}
                  onChange={e => setFormEmpresa(f => ({...f, razonSocial: e.target.value}))}
                />
              </label>
            </div>

            <div className="pos-field-row">
              <label className="pos-field floating">
                <span>RFC</span>
                <input
                  type="text"
                  maxLength={12}
                  value={formEmpresa.rfc}
                  onChange={e => setFormEmpresa(f => ({
                    ...f,
                    rfc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,12)
                  }))}
                />
              </label>
              <label className="pos-field floating">
                <span>Régimen Fiscal</span>
                <input
                  type="text"
                  value={formEmpresa.regimenFiscal}
                  onChange={e => setFormEmpresa(f => ({...f, regimenFiscal: e.target.value}))}
                />
              </label>
            </div>

            <h2 style={{margin:"24px 0 16px"}}>Datos de Contacto</h2>

            <label className="pos-field floating">
              <span>Dirección Fiscal</span>
              <input
                type="text"
                value={formEmpresa.direccionFiscal}
                onChange={e => setFormEmpresa(f => ({...f, direccionFiscal: e.target.value}))}
              />
            </label>

            <div className="pos-field-row">
              <label className="pos-field floating">
                <span>Teléfono</span>
                <input
                  type="text"
                  value={formEmpresa.telefono}
                  onChange={e => setFormEmpresa(f => ({...f, telefono: e.target.value}))}
                />
              </label>
              <label className="pos-field floating">
                <span>Correo Electrónico</span>
                <input
                  type="email"
                  value={formEmpresa.correo}
                  onChange={e => setFormEmpresa(f => ({...f, correo: e.target.value}))}
                />
              </label>
            </div>

            <div style={{display:"flex", justifyContent:"flex-end", marginTop:24}}>
              <button
                className="primary-button"
                type="button"
                disabled={saving || loading}
                onClick={guardarEmpresa}
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </section>

          <section className="pos-card" style={{textAlign:"center"}}>
            <h2 style={{marginBottom:16}}>Logotipo</h2>

            <div style={{
              width:120, height:120, borderRadius:16,
              background: formEmpresa.logoUrl ? "transparent" : "#fb5a35",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 16px", overflow:"hidden",
              border: formEmpresa.logoUrl ? "2px dashed #e2e2e2" : "none"
            }}>
              {formEmpresa.logoUrl ? (
                <img
                  src={formEmpresa.logoUrl}
                  alt="Logo"
                  style={{
                    width:"100%", height:"100%", objectFit:"contain",
                    borderRadius:16
                  }}
                  onError={e => { e.target.style.display="none"; }}
                />
              ) : (
                // misma marca que AppLayout cuando no hay logo personalizado
                <span className="brand-mark" style={{
                  display:"inline-flex",
                  width:72, height:72,
                  alignItems:"center", justifyContent:"center",
                  borderRadius:12, background:"#fb5a35",
                  color:"#fff", fontSize:28, fontWeight:700
                }}>
                  av
                </span>
              )}
            </div>

            <label className="pos-field floating">
              <span>URL del Logotipo</span>
              <input
                type="text"
                value={formEmpresa.logoUrl}
                onChange={e => setFormEmpresa(f => ({...f, logoUrl: e.target.value}))}
                placeholder="https://ejemplo.com/logo.png"
              />
            </label>

            <button
              className="primary-button"
              type="button"
              disabled={saving}
              style={{width:"100%", marginTop:12}}
              onClick={guardarSoloLogo}
            >
              {saving ? "Guardando..." : "Guardar Logo"}
            </button>

            <div style={{marginTop:12, color:"#6b7280", fontSize:14, lineHeight:1.4}}>
              <p>
                El logotipo se mostrará en la pantalla de inicio y en los recibos.
              </p>
              <p>
                Formatos recomendados: PNG, JPG, JPEG. Tamaño máximo: 2MB.
              </p>
            </div>
          </section>
        </div>
      )}

      {tab === "sucursales" && (
        <section className="settings-column">
          <div className="tab-section-header">
            <h2>Sucursales</h2>
            <span className="cash-count">{sucursales.length} sucursales</span>
          </div>
          <div className="branch-card-grid">
            {sucursales.map((s, i) => {
              const totalEmpleados = empleadosDeSucursal(s.idSucursal || s.id).length;
              return (
                <button
                  key={s.idSucursal || i}
                  className="pos-card branch-card"
                  onClick={() => abrirSucursal(s)}
                  type="button"
                >
                  <div>
                    <p style={{fontWeight:700, fontSize:16, margin:"0 0 4px"}}>{s.nombre}</p>
                    <p style={{color:"#64748b", fontSize:14, margin:"0 0 2px"}}>{s.direccion}</p>
                    {s.telefono && <p style={{color:"#64748b", fontSize:14, margin:"0 0 2px"}}>Tel: {s.telefono}</p>}
                    {s.horario && <p style={{color:"#64748b", fontSize:14, margin:0}}>{s.horario}</p>}
                  </div>
                  <div className="branch-card-side">
                    <span className="inv-badge ok">Activa</span>
                    <span className="cash-count">{totalEmpleados} empleados</span>
                  </div>
                </button>
              );
            })}
            {sucursales.length === 0 && !loading && (
              <p style={{color:"#64748b", textAlign:"center", padding:32}}>Sin sucursales registradas.</p>
            )}
          </div>
        </section>
      )}

      {sucursalSeleccionada && (
        <div className="modal-overlay" onClick={() => setSucursalSeleccionada(null)}>
          <div className="modal-card customer-modal" onClick={e => e.stopPropagation()}>
            <div className="tab-section-header">
              <div>
                <h2>{sucursalSeleccionada.nombre}</h2>
                <p className="page-subtitle">{sucursalSeleccionada.direccion}</p>
              </div>
              <button
                className="primary-button"
                onClick={() => abrirNuevoEmpleado(sucursalSeleccionada)}
                type="button"
              >
                + Nuevo Empleado
              </button>
            </div>

            <div className="employee-modal-list">
              {empleadosDeSucursal(sucursalSeleccionada.idSucursal || sucursalSeleccionada.id).map((empleado) => {
                const id = empleado.idEmpleado;
                const expandido = empleadoExpandido === id;
                return (
                  <div key={id} className="employee-card inline-employee-card">
                    <div className="employee-card-header">
                      <div>
                        <p style={{fontWeight:700, fontSize:16, margin:"0 0 4px"}}>{nombreEmpleado(empleado)}</p>
                        <p style={{color:"#64748b", fontSize:14, margin:"0 0 2px"}}>{empleado.correo}</p>
                        <p style={{color:"#64748b", fontSize:14, margin:0}}>
                          {nombreRol(empleado.rolId)} · {empleado.horaEntrada?.slice(0, 5)} - {empleado.horaSalida?.slice(0, 5)}
                        </p>
                      </div>
                      <div className="employee-card-actions">
                        <button className="ghost-button" onClick={() => abrirEditarEmpleado(empleado)} type="button">
                          Editar
                        </button>
                        <button className="danger-button" disabled={saving} onClick={() => borrarEmpleado(empleado)} type="button">
                          Eliminar
                        </button>
                        <button
                          aria-label="Ver auditoria del empleado"
                          className={`audit-toggle ${expandido ? "open" : ""}`}
                          onClick={() => setEmpleadoExpandido(expandido ? null : id)}
                          type="button"
                        />
                      </div>
                    </div>
                    {expandido && (
                      <div className="audit-grid employee-audit-grid">
                        <div><span>Registrado por</span><strong>{nombreEmpleadoPorId(empleado.createdBy)}</strong></div>
                        <div><span>Registro</span><strong>{fechaHora(empleado.createdAt)}</strong></div>
                        <div><span>Editado por</span><strong>{nombreEmpleadoPorId(empleado.updatedBy)}</strong></div>
                        <div><span>Ultima edicion</span><strong>{fechaHora(empleado.updatedAt)}</strong></div>
                        <div><span>Eliminado por</span><strong>{nombreEmpleadoPorId(empleado.deletedBy)}</strong></div>
                        <div><span>Eliminacion</span><strong>{fechaHora(empleado.deletedAt)}</strong></div>
                      </div>
                    )}
                  </div>
                );
              })}
              {empleadosDeSucursal(sucursalSeleccionada.idSucursal || sucursalSeleccionada.id).length === 0 && (
                <p style={{color:"#64748b", textAlign:"center", padding:24}}>Esta sucursal aun no tiene empleados.</p>
              )}
            </div>

            <div className="modal-actions" style={{marginTop:20}}>
              <button className="ghost-button" onClick={() => setSucursalSeleccionada(null)} type="button">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalSucursal && (
        <div className="modal-overlay" onClick={() => setModalSucursal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>Nueva Sucursal</h2>

            <label className="pos-field floating">
              <span>Nombre</span>
              <input
                type="text"
                value={formSucursal.nombre}
                onChange={e => setFormSucursal(f => ({...f, nombre: e.target.value}))}
              />
            </label>

            <label className="pos-field floating">
              <span>Dirección</span>
              <input
                type="text"
                value={formSucursal.direccion}
                onChange={e => setFormSucursal(f => ({...f, direccion: e.target.value}))}
              />
            </label>

            <div className="pos-field-row">
              <label className="pos-field floating">
                <span>Código Postal</span>
                <input
                  type="text"
                  maxLength={5}
                  value={formSucursal.codigoPostal}
                  onChange={e => setFormSucursal(f => ({...f, codigoPostal: e.target.value.replace(/\D/g,"").slice(0,5)}))}
                />
              </label>
              <label className="pos-field floating">
                <span>Teléfono</span>
                <input
                  type="text"
                  maxLength={10}
                  value={formSucursal.telefono}
                  onChange={e => setFormSucursal(f => ({...f, telefono: e.target.value.replace(/\D/g,"").slice(0,10)}))}
                />
              </label>
            </div>

            <label className="pos-field floating">
              <span>Horario</span>
              <input
                type="text"
                placeholder="Ej: Lunes a viernes 09:00 a 18:00"
                value={formSucursal.horario}
                onChange={e => setFormSucursal(f => ({...f, horario: e.target.value}))}
              />
            </label>

            <div style={{
              display:"flex", justifyContent:"flex-end",
              gap:12, marginTop:20
            }}>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setModalSucursal(false)}
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={saving}
                onClick={guardarSucursal}
              >
                {saving ? "Guardando..." : "Guardar Sucursal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEmpleado && (
        <div className="modal-overlay" onClick={() => {
          setModalEmpleado(false);
          setEmpleadoEditando(null);
        }}>
          <div className="modal-card customer-modal" onClick={e => e.stopPropagation()}>
            <h2>{empleadoEditando ? "Editar Empleado" : "Nuevo Empleado"}</h2>
            <div className="modal-grid">
              <label className="pos-field floating">
                <span>Nombre</span>
                <input value={formEmpleado.nombre} onChange={e => setFormEmpleado(f => ({...f, nombre: e.target.value}))} type="text" />
              </label>
              <label className="pos-field floating">
                <span>Apellido paterno</span>
                <input value={formEmpleado.apellidoPaterno} onChange={e => setFormEmpleado(f => ({...f, apellidoPaterno: e.target.value}))} type="text" />
              </label>
              <label className="pos-field floating">
                <span>Apellido materno</span>
                <input value={formEmpleado.apellidoMaterno} onChange={e => setFormEmpleado(f => ({...f, apellidoMaterno: e.target.value}))} type="text" />
              </label>
              <label className="pos-field floating">
                <span>Telefono</span>
                <input maxLength={10} value={formEmpleado.telefono} onChange={e => setFormEmpleado(f => ({...f, telefono: e.target.value.replace(/\D/g, "").slice(0, 10)}))} type="text" />
              </label>
              <label className="pos-field floating">
                <span>Correo</span>
                <input value={formEmpleado.correo} onChange={e => setFormEmpleado(f => ({...f, correo: e.target.value}))} type="email" />
              </label>
              <label className="pos-field floating">
                <span>Contraseña</span>
                <input value={formEmpleado.contrasena} onChange={e => setFormEmpleado(f => ({...f, contrasena: e.target.value}))} type="password" />
              </label>
              <label className="pos-field floating">
                <span>Hora entrada</span>
                <input value={formEmpleado.horaEntrada} onChange={e => setFormEmpleado(f => ({...f, horaEntrada: e.target.value}))} type="time" />
              </label>
              <label className="pos-field floating">
                <span>Hora salida</span>
                <input value={formEmpleado.horaSalida} onChange={e => setFormEmpleado(f => ({...f, horaSalida: e.target.value}))} type="time" />
              </label>
              <label className="pos-field floating">
                <span>Rol</span>
                <select
                  value={formEmpleado.rolId}
                  onChange={e => {
                    if (e.target.value === "__nuevo_rol__") {
                      setModalRol(true);
                      return;
                    }
                    setFormEmpleado(f => ({...f, rolId: e.target.value}));
                  }}
                >
                  <option value="">Selecciona</option>
                  {roles.map(rol => (
                    <option key={rol.idRol || rol.id} value={rol.idRol || rol.id}>
                      {rol.nombre}
                    </option>
                  ))}
                  <option value="__nuevo_rol__">+ Nuevo rol...</option>
                </select>
              </label>
              <label className="pos-field floating">
                <span>Sucursal</span>
                <select
                  disabled={Boolean(sucursalSeleccionada && !empleadoEditando)}
                  value={formEmpleado.sucursalIdSucursal}
                  onChange={e => setFormEmpleado(f => ({...f, sucursalIdSucursal: e.target.value}))}
                >
                  <option value="">Selecciona</option>
                  {sucursales.map(sucursal => (
                    <option key={sucursal.idSucursal || sucursal.id} value={sucursal.idSucursal || sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{display:"flex", justifyContent:"flex-end", gap:12, marginTop:20}}>
              <button className="ghost-button" type="button" onClick={() => {
                setModalEmpleado(false);
                setEmpleadoEditando(null);
              }}>
                Cancelar
              </button>
              <button className="primary-button" type="button" disabled={saving} onClick={guardarEmpleado}>
                {saving ? "Guardando..." : empleadoEditando ? "Guardar Cambios" : "Guardar Empleado"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalRol && (
        <div className="modal-overlay nested-modal-overlay" onClick={() => setModalRol(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>Nuevo Rol</h2>
            <label className="pos-field floating">
              <span>Nombre</span>
              <input
                type="text"
                value={formRol.nombre}
                onChange={e => setFormRol(f => ({ ...f, nombre: e.target.value }))}
              />
            </label>
            <label className="pos-field floating">
              <span>Descripcion</span>
              <input
                type="text"
                value={formRol.descripcion}
                onChange={e => setFormRol(f => ({ ...f, descripcion: e.target.value }))}
              />
            </label>
            <div style={{display:"flex", justifyContent:"flex-end", gap:12, marginTop:20}}>
              <button className="ghost-button" type="button" onClick={() => setModalRol(false)}>
                Cancelar
              </button>
              <button className="primary-button" type="button" disabled={saving} onClick={guardarRol}>
                {saving ? "Guardando..." : "Guardar Rol"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalError && (
        <div className="modal-error-overlay" onClick={() => setModalError("")}>
          <div className="modal-error-card" onClick={e => e.stopPropagation()}>
            <p className="modal-error-icon">âš </p>
            <p className="modal-error-msg">{modalError}</p>
            <button
              className="primary-button"
              onClick={() => setModalError("")}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </section>
  );
}


