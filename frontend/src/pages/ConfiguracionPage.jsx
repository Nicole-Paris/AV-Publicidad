import { useEffect, useState } from "react";
import {
  listarSucursales, crearSucursal, actualizarSucursal,
  eliminarSucursal,
  listarGlobalValues, crearGlobalValue,
  actualizarGlobalValue
} from "../api/configuracionApi.js";
import {
  actualizarCuentaEmpleado,
  actualizarEmpleado,
  crearEmpleado,
  eliminarEmpleado,
  listarEmpleados,
  listarRoles
} from "../api/empleadoApi.js";
import { listarCortesPorEmpleado } from "../api/corteCajaApi.js";
import { listarPedidos } from "../api/pedidoApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { esAdministrador, esEmpleado } from "../auth/permissions.js";

export function ConfiguracionPage() {
  const { session } = useAuth();
  const soloEmpleado = esEmpleado(session);
  const puedeAdministrarSucursales = esAdministrador(session);
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
  const [sucursalEditando, setSucursalEditando] = useState(null);
  const [sucursalAEliminar, setSucursalAEliminar] = useState(null);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState(null);
  const [empleadoExpandido, setEmpleadoExpandido] = useState(null);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [busquedaEmpleadoExistente, setBusquedaEmpleadoExistente] = useState("");
  const [empleadosPorSucursalExtra, setEmpleadosPorSucursalExtra] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("av_empleados_sucursales_extra") || "{}");
    } catch {
      return {};
    }
  });
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
  const [formEmpresa, setFormEmpresa] = useState({
    nombreEmpresa: "", razonSocial: "", rfc: "",
    regimenFiscal: "", direccionFiscal: "",
    telefono: "", correo: "",
    logoUrl: ""
  });
  const [empresaEditando, setEmpresaEditando] = useState(false);
  const [logoArchivoNombre, setLogoArchivoNombre] = useState("");
  const [formCuenta, setFormCuenta] = useState({
    nombre: session?.nombre || "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    correo: session?.correo || "",
    contrasena: ""
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

  function globalValuePorNombre(nombre) {
    return globalValues.find(g => g.nombre === nombre);
  }

  function auditoriaEmpresa() {
    const nombres = ["nombreEmpresa", "razonSocial", "rfc", "regimenFiscal", "direccionFiscal", "telefono", "correo", "logoUrl"];
    const valores = nombres.map(globalValuePorNombre).filter(Boolean);
    if (valores.length === 0) {
      return {};
    }

    const primero = [...valores].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))[0];
    const ultimoEditado = [...valores]
      .filter(item => item.updatedAt || item.updatedBy)
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];

    return {
      createdBy: primero?.createdBy,
      createdAt: primero?.createdAt,
      updatedBy: ultimoEditado?.updatedBy,
      updatedAt: ultimoEditado?.updatedAt
    };
  }

  function valorEmpresa(nombre) {
    const valor = formEmpresa[nombre];
    return valor && valor.toString().trim() ? valor : "-";
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

  function sucursalExiste(sucursalId) {
    return sucursales.some(sucursal =>
      Number(sucursal.idSucursal || sucursal.id) === Number(sucursalId)
    );
  }

  function empleadosDeSucursal(sucursalId) {
    if (!sucursalExiste(sucursalId)) {
      return [];
    }
    const extras = empleadosPorSucursalExtra[String(sucursalId)] || [];
    return empleados.filter(empleado =>
      Number(empleado.sucursalIdSucursal) === Number(sucursalId) ||
      extras.map(Number).includes(Number(empleado.idEmpleado))
    );
  }

  function sucursalesDeEmpleado(empleado) {
    const sucursalesIds = new Set();
    if (empleado?.sucursalIdSucursal && sucursalExiste(empleado.sucursalIdSucursal)) {
      sucursalesIds.add(Number(empleado.sucursalIdSucursal));
    }

    Object.entries(empleadosPorSucursalExtra).forEach(([sucursalId, empleadoIds]) => {
      if (
        sucursalExiste(sucursalId) &&
        (empleadoIds || []).map(Number).includes(Number(empleado.idEmpleado))
      ) {
        sucursalesIds.add(Number(sucursalId));
      }
    });

    return Array.from(sucursalesIds);
  }

  function quitarEmpleadoExtraDeSucursal(empleadoId, sucursalId) {
    const key = String(sucursalId);
    const nextIds = (empleadosPorSucursalExtra[key] || [])
      .map(Number)
      .filter(id => id !== Number(empleadoId));
    const next = { ...empleadosPorSucursalExtra, [key]: nextIds };

    if (nextIds.length === 0) {
      delete next[key];
    }

    setEmpleadosPorSucursalExtra(next);
    localStorage.setItem("av_empleados_sucursales_extra", JSON.stringify(next));
  }

  function empleadosParaAgregar(sucursalId) {
    const query = busquedaEmpleadoExistente.trim().toLowerCase();
    if (!query) return [];
    const idsActuales = empleadosDeSucursal(sucursalId).map(empleado => Number(empleado.idEmpleado));

    return empleados
      .filter(empleado => !idsActuales.includes(Number(empleado.idEmpleado)))
      .filter(empleado => {
        const texto = `${nombreEmpleado(empleado)} ${empleado.correo || ""}`.toLowerCase();
        return texto.includes(query);
      })
      .slice(0, 5);
  }

  function abrirSucursal(sucursal) {
    setSucursalSeleccionada(sucursal);
    setEmpleadoExpandido(null);
    setBusquedaEmpleadoExistente("");
  }

  function abrirNuevaSucursal() {
    setSucursalEditando(null);
    setFormSucursal({
      nombre: "", direccion: "", codigoPostal: "",
      telefono: "", horario: ""
    });
    setModalSucursal(true);
  }

  function abrirEditarSucursal(sucursal) {
    setSucursalEditando(sucursal);
    setFormSucursal({
      nombre: sucursal.nombre || "",
      direccion: sucursal.direccion || "",
      codigoPostal: sucursal.codigoPostal || "",
      telefono: sucursal.telefono || "",
      horario: sucursal.horario || ""
    });
    setModalSucursal(true);
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
      contrasena: "",
      horaEntrada: empleado.horaEntrada?.slice(0, 5) || "09:00",
      horaSalida: empleado.horaSalida?.slice(0, 5) || "18:00",
      rolId: empleado.rolId ? String(empleado.rolId) : "",
      sucursalIdSucursal: empleado.sucursalIdSucursal ? String(empleado.sucursalIdSucursal) : ""
    });
    setModalEmpleado(true);
  }

  function solicitarEliminarEmpleado(empleado) {
    setEmpleadoAEliminar(empleado);
  }

  useEffect(() => {
    setTab(soloEmpleado ? "mi-cuenta" : "empresa");
  }, [soloEmpleado]);

  useEffect(() => {
    if (empleados.length > 0 && session?.empleadoId) {
      const empleadoActual = empleados.find(item => Number(item.idEmpleado) === Number(session.empleadoId));
      if (empleadoActual) {
        setFormCuenta({
          nombre: empleadoActual.nombre || "",
          apellidoPaterno: empleadoActual.apellidoPaterno || "",
          apellidoMaterno: empleadoActual.apellidoMaterno || "",
          telefono: empleadoActual.telefono || "",
          correo: empleadoActual.correo || "",
          contrasena: ""
        });
      }
    }
  }, [empleados, session?.empleadoId]);

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

  useEffect(() => {
    if (!soloEmpleado || empleados.length === 0) {
      return;
    }

    const empleadoActual = empleados.find(
      (empleado) => Number(empleado.idEmpleado) === Number(session?.empleadoId)
    );

    if (!empleadoActual) {
      return;
    }

    setEmpleadoEditando(empleadoActual);
    setFormEmpleado({
      nombre: empleadoActual.nombre || "",
      apellidoPaterno: empleadoActual.apellidoPaterno || "",
      apellidoMaterno: empleadoActual.apellidoMaterno || "",
      telefono: empleadoActual.telefono || "",
      correo: empleadoActual.correo || "",
      contrasena: "",
      horaEntrada: empleadoActual.horaEntrada?.slice(0, 5) || "09:00",
      horaSalida: empleadoActual.horaSalida?.slice(0, 5) || "18:00",
      rolId: empleadoActual.rolId ? String(empleadoActual.rolId) : "",
      sucursalIdSucursal: empleadoActual.sucursalIdSucursal ? String(empleadoActual.sucursalIdSucursal) : ""
    });
  }, [soloEmpleado, empleados, session?.empleadoId]);

  async function guardarEmpresa() {
    const telefono = (formEmpresa.telefono || "").trim();
    if (telefono && !/^\d{10}$/.test(telefono)) {
      mostrarError("El teléfono de la empresa debe tener exactamente 10 dígitos numéricos.");
      return;
    }

    const rfc = (formEmpresa.rfc || "").trim();
    if (rfc && !/^[A-Z0-9]{12,13}$/.test(rfc)) {
      mostrarError("El RFC debe tener 12 o 13 caracteres alfanuméricos.");
      return;
    }

    const correo = (formEmpresa.correo || "").trim();
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      mostrarError("El correo electrónico no tiene un formato válido.");
      return;
    }

    setSaving(true);
    try {
      const camposConValor = Object.entries(formEmpresa).filter(
        ([, valor]) => valor && valor.toString().trim() !== ""
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
            createdBy: existente.createdBy || session.empleadoId,
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

      const gvsRefreshed = await listarGlobalValues();
      const gvsArr = safe(gvsRefreshed);
      const logoGuardado = gvsArr.find(g => g.nombre === "logoUrl")?.valor || formEmpresa.logoUrl || "";
      localStorage.setItem("av_logo_url", logoGuardado);
      window.dispatchEvent(new Event("av_logo_changed"));
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
        logoUrl: logoGuardado || f.logoUrl
      }));

      mostrarSuccess("Datos guardados correctamente.");
      setEmpresaEditando(false);
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function guardarMiCuenta() {
    if (!formCuenta.nombre.trim()) {
      mostrarError("Escribe tu nombre."); return;
    }
    if (!formCuenta.apellidoPaterno.trim()) {
      mostrarError("Escribe tu apellido paterno."); return;
    }
    if (!formCuenta.telefono.trim()) {
      mostrarError("Escribe tu teléfono."); return;
    }
    if (!formCuenta.correo.trim()) {
      mostrarError("Escribe tu correo."); return;
    }

    setSaving(true);
    try {
      const empleadoActual = empleados.find(item => Number(item.idEmpleado) === Number(session?.empleadoId));
      const payload = {
        nombre: formCuenta.nombre.trim(),
        apellidoPaterno: formCuenta.apellidoPaterno.trim(),
        apellidoMaterno: formCuenta.apellidoMaterno.trim(),
        telefono: formCuenta.telefono.trim(),
        correo: formCuenta.correo.trim(),
        horaEntrada: empleadoActual?.horaEntrada || "09:00:00",
        horaSalida: empleadoActual?.horaSalida || "18:00:00",
        rolId: Number(empleadoActual?.rolId || session?.rolId || 0),
        sucursalIdSucursal: Number(empleadoActual?.sucursalIdSucursal || session?.sucursalIdSucursal || 0),
        createdBy: empleadoActual?.createdBy || session?.empleadoId,
        updatedBy: session?.empleadoId
      };

      if (formCuenta.contrasena.trim()) {
        payload.contrasena = formCuenta.contrasena.trim();
      }

      await actualizarEmpleado(session?.empleadoId, payload);
      setFormCuenta(f => ({ ...f, contrasena: "" }));
      mostrarSuccess("Tus datos personales se actualizaron correctamente.");
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
    const nombreNormalizado = formSucursal.nombre.trim().toLowerCase();
    const sucursalDuplicada = sucursales.some(sucursal => {
      const idActual = sucursalEditando ? Number(sucursalEditando.idSucursal || sucursalEditando.id) : null;
      const idSucursal = Number(sucursal.idSucursal || sucursal.id);
      return sucursal.nombre?.trim().toLowerCase() === nombreNormalizado && idSucursal !== idActual;
    });
    if (sucursalDuplicada) {
      mostrarError("Ya existe una sucursal activa con ese nombre.");
      return;
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
      const payload = {
        nombre: formSucursal.nombre.trim(),
        direccion: formSucursal.direccion.trim(),
        codigoPostal: formSucursal.codigoPostal.trim(),
        telefono: formSucursal.telefono.trim(),
        horario: formSucursal.horario.trim(),
        createdBy: sucursalEditando?.createdBy || session.empleadoId,
        updatedBy: sucursalEditando ? session.empleadoId : null
      };

      if (sucursalEditando) {
        await actualizarSucursal(sucursalEditando.idSucursal || sucursalEditando.id, payload);
      } else {
        await crearSucursal(payload);
      }

      const sucs = await listarSucursales();
      setSucursales(safe(sucs));
      setModalSucursal(false);
      setSucursalEditando(null);
      setFormSucursal({
        nombre: "", direccion: "", codigoPostal: "",
        telefono: "", horario: ""
      });
      mostrarSuccess(sucursalEditando ? "Sucursal actualizada correctamente." : "Sucursal creada correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmarEliminarSucursal() {
    if (!sucursalAEliminar) return;

    const sucursalId = sucursalAEliminar.idSucursal || sucursalAEliminar.id;
    const empleadosAsignados = empleadosDeSucursal(sucursalId).length;
    if (empleadosAsignados > 0) {
      mostrarError(`No se puede eliminar la sucursal porque tiene ${empleadosAsignados} empleado${empleadosAsignados === 1 ? "" : "s"} asignado${empleadosAsignados === 1 ? "" : "s"}.`);
      return;
    }

    setSaving(true);
    try {
      await eliminarSucursal(sucursalId, session?.empleadoId);
      const sucs = await listarSucursales();
      setSucursales(safe(sucs));
      setSucursalAEliminar(null);
      if (Number(sucursalSeleccionada?.idSucursal || sucursalSeleccionada?.id) === Number(sucursalId)) {
        setSucursalSeleccionada(null);
      }
      mostrarSuccess("Sucursal eliminada correctamente. Las ventas pasadas se conservan.");
    } catch (err) {
      const mensaje = err.message || String(err);
      if (mensaje.toLowerCase().includes("empleados")) {
        mostrarError("No se puede eliminar la sucursal porque tiene empleados asignados.");
      } else {
        mostrarError(mensaje);
      }
    } finally {
      setSaving(false);
    }
  }

  async function asignarEmpleadoASucursal(empleado) {
    if (!sucursalSeleccionada) return;
    const sucursalId = String(sucursalSeleccionada.idSucursal || sucursalSeleccionada.id);
    const next = {
      ...empleadosPorSucursalExtra,
      [sucursalId]: Array.from(new Set([...(empleadosPorSucursalExtra[sucursalId] || []), empleado.idEmpleado]))
    };
    setEmpleadosPorSucursalExtra(next);
    localStorage.setItem("av_empleados_sucursales_extra", JSON.stringify(next));
    setBusquedaEmpleadoExistente("");
    mostrarSuccess("Empleado agregado a la sucursal correctamente.");
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
    if (!/^\d{10}$/.test(formEmpleado.telefono.trim())) {
      mostrarError("El teléfono del empleado debe tener exactamente 10 dígitos numéricos."); return;
    }
    if (!formEmpleado.correo.trim()) {
      mostrarError("Escribe el correo."); return;
    }
    if (!empleadoEditando && !formEmpleado.contrasena.trim()) {
      mostrarError("Escribe la contraseña."); return;
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
        horaEntrada: `${formEmpleado.horaEntrada}:00`,
        horaSalida: `${formEmpleado.horaSalida}:00`,
        rolId: Number(formEmpleado.rolId),
        sucursalIdSucursal: Number(formEmpleado.sucursalIdSucursal),
        createdBy: empleadoEditando?.createdBy || session.empleadoId,
        updatedBy: empleadoEditando ? session.empleadoId : null
      };
      if (!empleadoEditando || formEmpleado.contrasena.trim()) {
        payload.contrasena = formEmpleado.contrasena.trim();
      }

      if (empleadoEditando) {
        await actualizarEmpleado(empleadoEditando.idEmpleado, payload);
      } else {
        await crearEmpleado(payload);
      }

      const emps = await listarEmpleados();
      const empsSeguros = safe(emps).map(empleado =>
        empleadoEditando && Number(empleado.idEmpleado) === Number(empleadoEditando.idEmpleado)
          ? { ...empleado, updatedBy: session.empleadoId, updatedAt: empleado.updatedAt || new Date().toISOString() }
          : empleado
      );
      setEmpleados(empsSeguros);
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

  async function guardarMiCuenta() {
    if (!empleadoEditando) {
      mostrarError("No se pudo encontrar la informacion del empleado.");
      return;
    }
    if (!formEmpleado.contrasena.trim()) {
      mostrarError("Escribe tu nueva contraseña.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        contrasena: formEmpleado.contrasena.trim()
      };

      const actualizado = await actualizarCuentaEmpleado(empleadoEditando.idEmpleado, payload);
      setEmpleados(prev => prev.map(empleado =>
        Number(empleado.idEmpleado) === Number(empleadoEditando.idEmpleado)
          ? { ...empleado, ...actualizado }
          : empleado
      ));
      setEmpleadoEditando(actualizado);
      setFormEmpleado(f => ({ ...f, contrasena: "" }));
      mostrarSuccess("Contraseña actualizada correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function borrarEmpleado(empleado) {
    const sucursalActualId = sucursalSeleccionada
      ? Number(sucursalSeleccionada.idSucursal || sucursalSeleccionada.id)
      : Number(empleado.sucursalIdSucursal);
    const sucursalesLigadas = sucursalesDeEmpleado(empleado);
    const estaEnSucursalComoExtra = (empleadosPorSucursalExtra[String(sucursalActualId)] || [])
      .map(Number)
      .includes(Number(empleado.idEmpleado));
    const tieneOtrasSucursales = sucursalesLigadas.some(id => Number(id) !== Number(sucursalActualId));
    setSaving(true);
    try {
      if (estaEnSucursalComoExtra) {
        quitarEmpleadoExtraDeSucursal(empleado.idEmpleado, sucursalActualId);
        setEmpleadoExpandido(null);
        setSucursalSeleccionada(current => current ? { ...current } : current);
        setEmpleadoAEliminar(null);
        mostrarSuccess("Empleado quitado de esta sucursal correctamente.");
        return;
      }

      if (tieneOtrasSucursales) {
        const nuevaSucursalId = sucursalesLigadas.find(id => Number(id) !== Number(sucursalActualId));
        await actualizarEmpleado(empleado.idEmpleado, {
          nombre: empleado.nombre,
          apellidoPaterno: empleado.apellidoPaterno,
          apellidoMaterno: empleado.apellidoMaterno || "",
          telefono: empleado.telefono,
          correo: empleado.correo,
          horaEntrada: empleado.horaEntrada,
          horaSalida: empleado.horaSalida,
          rolId: Number(empleado.rolId),
          sucursalIdSucursal: Number(nuevaSucursalId),
          createdBy: empleado.createdBy || session.empleadoId,
          updatedBy: session.empleadoId
        });
        quitarEmpleadoExtraDeSucursal(empleado.idEmpleado, nuevaSucursalId);
        const emps = await listarEmpleados();
        setEmpleados(safe(emps));
        setEmpleadoExpandido(null);
        setSucursalSeleccionada(current => current ? { ...current } : current);
        setEmpleadoAEliminar(null);
        mostrarSuccess("Empleado quitado de esta sucursal correctamente.");
        return;
      }

      // Verificar caja abierta
      const cortes = await listarCortesPorEmpleado(empleado.idEmpleado);
      if ((cortes || []).some(c => !c.horaFin)) {
        mostrarError("No se puede eliminar el empleado: tiene un corte de caja abierto.");
        return;
      }

      // Verificar pedidos pendientes
      const pedidos = await listarPedidos();
      const pendientes = (pedidos || []).filter(p =>
        Number(p.createdBy) === Number(empleado.idEmpleado) &&
        p.estado !== "Pagado" &&
        p.estado !== "Cancelado"
      );
      if (pendientes.length > 0) {
        mostrarError("No se puede eliminar el empleado: tiene pedidos activos sin finalizar.");
        return;
      }

      await eliminarEmpleado(empleado.idEmpleado, session.empleadoId);
      const emps = await listarEmpleados();
      setEmpleados(safe(emps));
      setEmpleadoExpandido(null);
      setSucursalSeleccionada(current => current ? { ...current } : current);
      setEmpleadoAEliminar(null);
      mostrarSuccess("Empleado eliminado correctamente.");
    } catch (err) {
      mostrarError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  function cargarLogoDesdeArchivo(event) {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    const formatosPermitidos = ["image/jpeg", "image/jpg", "image/png"];
    if (!formatosPermitidos.includes(archivo.type)) {
      mostrarError("El logo debe ser un archivo JPG, JPEG o PNG.");
      event.target.value = "";
      return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
      mostrarError("El logo no debe pesar más de 2MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormEmpresa(f => ({ ...f, logoUrl: reader.result || "" }));
      setLogoArchivoNombre(archivo.name);
      mostrarSuccess("Logo cargado. Presiona Guardar Cambios para conservarlo.");
    };
    reader.onerror = () => mostrarError("No se pudo leer el archivo del logo.");
    reader.readAsDataURL(archivo);
  }

  const auditoriaDatosEmpresa = auditoriaEmpresa();
  const logoVisible = formEmpresa.logoUrl?.toString().trim() || "";

  if (soloEmpleado) {
    return (
      <section className="page-stack">
        {success && <div className="pos-alert success">{success}</div>}

        <section className="pos-card account-card">
          <h2>Mi informacion</h2>
          {loading ? (
            <p className="report-empty">Cargando informacion...</p>
          ) : (
            <>
              <div className="audit-grid account-info-grid">
                <div><span>Nombre</span><strong>{nombreEmpleado(empleadoEditando)}</strong></div>
                <div><span>Correo</span><strong>{empleadoEditando?.correo || "-"}</strong></div>
                <div><span>Rol</span><strong>{nombreRol(empleadoEditando?.rolId)}</strong></div>
                <div><span>Sucursal</span><strong>{nombreSucursal(empleadoEditando?.sucursalIdSucursal)}</strong></div>
                <div><span>Telefono</span><strong>{empleadoEditando?.telefono || "-"}</strong></div>
                <div><span>Hora entrada</span><strong>{empleadoEditando?.horaEntrada?.slice(0, 5) || "-"}</strong></div>
                <div><span>Hora salida</span><strong>{empleadoEditando?.horaSalida?.slice(0, 5) || "-"}</strong></div>
              </div>

              <div className="modal-grid account-edit-grid">
                <label className="pos-field floating">
                  <span>Nueva contraseña</span>
                  <input
                    value={formEmpleado.contrasena}
                    onChange={e => setFormEmpleado(f => ({...f, contrasena: e.target.value}))}
                    type="password"
                    placeholder="Escribe tu nueva contraseña"
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button className="primary-button" disabled={saving || loading} onClick={guardarMiCuenta} type="button">
                  {saving ? "Guardando..." : "Cambiar contraseña"}
                </button>
              </div>
            </>
          )}
        </section>

        {modalError && (
          <div className="modal-error-overlay">
            <div className="modal-error-card" onClick={(event) => event.stopPropagation()}>
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

  return (
    <section className="page-stack">
      <div className="page-header" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {tab === "sucursales" && (
            <button
              className="primary-button"
              type="button"
              onClick={abrirNuevaSucursal}
            >
              + Nueva Sucursal
            </button>
          )}
        </div>
      </div>

      {success && <div className="pos-alert success">{success}</div>}

      <div className="inv-tabs">
        {soloEmpleado ? (
          <button
            className={tab === "mi-cuenta" ? "inv-tab active" : "inv-tab"}
            onClick={() => setTab("mi-cuenta")}
            type="button"
          >
            Mi cuenta
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>

      {soloEmpleado && tab === "mi-cuenta" && (
        <section className="pos-card" style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0 }}>Datos personales</h2>
              <p style={{ margin: "6px 0 0", color: "#64748b" }}>Actualiza tu información de cuenta sin acceder a la administración.</p>
            </div>
          </div>

          <div className="pos-field-row">
            <label className="pos-field floating">
              <span>Nombre</span>
              <input
                type="text"
                value={formCuenta.nombre}
                onChange={(e) => setFormCuenta(f => ({ ...f, nombre: e.target.value }))}
              />
            </label>
            <label className="pos-field floating">
              <span>Apellido paterno</span>
              <input
                type="text"
                value={formCuenta.apellidoPaterno}
                onChange={(e) => setFormCuenta(f => ({ ...f, apellidoPaterno: e.target.value }))}
              />
            </label>
          </div>

          <div className="pos-field-row">
            <label className="pos-field floating">
              <span>Apellido materno</span>
              <input
                type="text"
                value={formCuenta.apellidoMaterno}
                onChange={(e) => setFormCuenta(f => ({ ...f, apellidoMaterno: e.target.value }))}
              />
            </label>
            <label className="pos-field floating">
              <span>Teléfono</span>
              <input
                type="text"
                value={formCuenta.telefono}
                onChange={(e) => setFormCuenta(f => ({ ...f, telefono: e.target.value }))}
              />
            </label>
          </div>

          <label className="pos-field floating">
            <span>Correo electrónico</span>
            <input
              type="email"
              value={formCuenta.correo}
              onChange={(e) => setFormCuenta(f => ({ ...f, correo: e.target.value }))}
            />
          </label>

          <label className="pos-field floating">
            <span>Nueva contraseña (opcional)</span>
            <input
              type="password"
              value={formCuenta.contrasena}
              onChange={(e) => setFormCuenta(f => ({ ...f, contrasena: e.target.value }))}
              placeholder="Dejar vacío para no cambiarla"
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button className="primary-button" type="button" disabled={saving} onClick={guardarMiCuenta}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </section>
      )}

      {!soloEmpleado && tab === "empresa" && (
        <div style={{display:"grid", gridTemplateColumns:"1fr 320px", gap:24, alignItems:"start"}}>
          <section className="pos-card">
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24}}>
              <h2 style={{margin:0}}>Datos Fiscales</h2>
              {!empresaEditando && (
                <button className="ghost-button" type="button" onClick={() => setEmpresaEditando(true)}>
                  Editar
                </button>
              )}
            </div>

            {!empresaEditando ? (
              <>
                <div className="audit-grid">
                  <div><span>Nombre de la Empresa</span><strong>{valorEmpresa("nombreEmpresa")}</strong></div>
                  <div><span>Razón Social</span><strong>{valorEmpresa("razonSocial")}</strong></div>
                  <div><span>RFC</span><strong>{valorEmpresa("rfc")}</strong></div>
                  <div><span>Régimen Fiscal</span><strong>{valorEmpresa("regimenFiscal")}</strong></div>
                  <div><span>Dirección Fiscal</span><strong>{valorEmpresa("direccionFiscal")}</strong></div>
                  <div><span>Teléfono</span><strong>{valorEmpresa("telefono")}</strong></div>
                  <div><span>Correo Electrónico</span><strong>{valorEmpresa("correo")}</strong></div>
                </div>

                <h2 style={{margin:"24px 0 16px"}}>Auditoría</h2>
                <div className="audit-grid">
                  <div><span>Creado por</span><strong>{nombreEmpleadoPorId(auditoriaDatosEmpresa.createdBy)}</strong></div>
                  <div><span>Creación</span><strong>{fechaHora(auditoriaDatosEmpresa.createdAt)}</strong></div>
                  <div><span>Editado por</span><strong>{nombreEmpleadoPorId(auditoriaDatosEmpresa.updatedBy)}</strong></div>
                  <div><span>Última edición</span><strong>{fechaHora(auditoriaDatosEmpresa.updatedAt)}</strong></div>
                </div>
              </>
            ) : (
              <>
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
                      maxLength={13}
                      value={formEmpresa.rfc}
                      onChange={e => setFormEmpresa(f => ({
                        ...f,
                        rfc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,13)
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
                      onChange={e => setFormEmpresa(f => ({...f, telefono: e.target.value.replace(/\D/g, "").slice(0,10)}))}
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

                <div style={{display:"flex", justifyContent:"flex-end", gap:12, marginTop:24}}>
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={saving}
                    onClick={() => setEmpresaEditando(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={saving || loading}
                    onClick={guardarEmpresa}
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </>
            )}
          </section>

          <section className="pos-card" style={{textAlign:"center"}}>
            <h2 style={{marginBottom:16}}>Logotipo</h2>

            <div style={{
              width:120, height:120, borderRadius:16,
              background: logoVisible ? "transparent" : "#fb5a35",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 16px", overflow:"hidden",
              border: logoVisible ? "2px dashed #e2e2e2" : "none"
            }}>
              {logoVisible ? (
                <img
                  src={logoVisible}
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

            {empresaEditando && (
              <>
                <label className="pos-field floating">
                  <span>URL del Logotipo</span>
                  <input
                    type="text"
                    value={formEmpresa.logoUrl}
                    onChange={e => setFormEmpresa(f => ({...f, logoUrl: e.target.value}))}
                    placeholder="https://ejemplo.com/logo.png"
                  />
                </label>

                <div className="logo-upload-control">
                  <span className="logo-upload-title">Subir logo JPG o PNG</span>
                  <div className="logo-upload-row">
                    <label className="logo-upload-button">
                      Elegir archivo
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={cargarLogoDesdeArchivo}
                      />
                    </label>
                    <span className="logo-upload-name">
                      {logoArchivoNombre || "JPG/PNG, max. 2MB"}
                    </span>
                  </div>
                </div>

              </>
            )}

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

      {!soloEmpleado && tab === "sucursales" && (
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
                    <span
                      className="ghost-button branch-edit-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        abrirEditarSucursal(s);
                      }}
                    >
                      Editar
                    </span>
                    {puedeAdministrarSucursales && (
                      <span
                        className="danger-button branch-delete-action"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSucursalAEliminar(s);
                        }}
                      >
                        Eliminar
                      </span>
                    )}
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
        <div className="modal-overlay">
          <div className="modal-card customer-modal" onClick={e => e.stopPropagation()}>
            <div className="tab-section-header">
              <div>
                <h2>{sucursalSeleccionada.nombre}</h2>
                <p className="page-subtitle">{sucursalSeleccionada.direccion}</p>
              </div>
              <div className="branch-employee-tools">
                <div className="existing-employee-inline">
                  <label className="pos-field floating">
                    <span>Agregar empleado existente</span>
                    <input
                      type="text"
                      value={busquedaEmpleadoExistente}
                      onChange={e => setBusquedaEmpleadoExistente(e.target.value)}
                      placeholder="Buscar por nombre o correo"
                    />
                  </label>
                  {empleadosParaAgregar(sucursalSeleccionada.idSucursal || sucursalSeleccionada.id).length > 0 && (
                    <div className="employee-search-results inline-results">
                      {empleadosParaAgregar(sucursalSeleccionada.idSucursal || sucursalSeleccionada.id).map(empleado => (
                        <button
                          className="employee-search-option"
                          disabled={saving}
                          key={empleado.idEmpleado}
                          onClick={() => asignarEmpleadoASucursal(empleado)}
                          type="button"
                        >
                          <strong>{nombreEmpleado(empleado)}</strong>
                          <span>{empleado.correo} · {nombreSucursal(empleado.sucursalIdSucursal)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="primary-button"
                  onClick={() => abrirNuevoEmpleado(sucursalSeleccionada)}
                  type="button"
                >
                  + Nuevo Empleado
                </button>
              </div>
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
                        <button className="danger-button" disabled={saving} onClick={() => solicitarEliminarEmpleado(empleado)} type="button">
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

      {empleadoAEliminar && (
        <div className="modal-overlay">
          <div className="modal-card delete-confirm-modal" onClick={e => e.stopPropagation()}>
            {(() => {
              const sucursalActualId = sucursalSeleccionada
                ? Number(sucursalSeleccionada.idSucursal || sucursalSeleccionada.id)
                : Number(empleadoAEliminar.sucursalIdSucursal);
              const tieneOtrasSucursales = sucursalesDeEmpleado(empleadoAEliminar)
                .some(id => Number(id) !== Number(sucursalActualId));

              return (
                <>
                  <h2>{tieneOtrasSucursales ? "Quitar empleado de sucursal" : "Eliminar empleado"}</h2>
                  {tieneOtrasSucursales ? (
                    <>
                      <p>
                        ¿Seguro que quieres quitar de esta sucursal a <strong>{nombreEmpleado(empleadoAEliminar)}</strong>?
                      </p>
                      <p>
                        El empleado seguirá disponible en sus otras sucursales.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Este empleado solo está asignado a esta sucursal. Si lo eliminas ya no se podrá recuperar.
                      </p>
                      <p>
                        ¿Seguro que quieres eliminar a <strong>{nombreEmpleado(empleadoAEliminar)}</strong>?
                      </p>
                    </>
                  )}
                  <div className="modal-actions">
                    <button
                      className="ghost-button"
                      disabled={saving}
                      onClick={() => setEmpleadoAEliminar(null)}
                      type="button"
                    >
                      {tieneOtrasSucursales ? "Cancelar" : "No eliminar"}
                    </button>
                    <button
                      className="danger-button"
                      disabled={saving}
                      onClick={() => borrarEmpleado(empleadoAEliminar)}
                      type="button"
                    >
                      {saving ? "Procesando..." : tieneOtrasSucursales ? "Confirmar" : "Sí eliminar"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {sucursalAEliminar && (
        <div className="modal-overlay">
          <div className="modal-card delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <h2>Eliminar sucursal</h2>
            <p>
              ¿Seguro que quieres eliminar la sucursal <strong>{sucursalAEliminar.nombre}</strong>?
            </p>
            <p>
              La sucursal se eliminará del sistema pero las ventas y registros pasados no se borrarán.
            </p>
            <div className="modal-actions">
              <button
                className="ghost-button"
                disabled={saving}
                onClick={() => setSucursalAEliminar(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="danger-button"
                disabled={saving}
                onClick={confirmarEliminarSucursal}
                type="button"
              >
                {saving ? "Eliminando..." : "Confirmar eliminacion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalSucursal && (
        <div className="modal-overlay">
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>{sucursalEditando ? "Editar Sucursal" : "Nueva Sucursal"}</h2>

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
                onClick={() => {
                  setModalSucursal(false);
                  setSucursalEditando(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={saving}
                onClick={guardarSucursal}
              >
                {saving ? "Guardando..." : sucursalEditando ? "Guardar Cambios" : "Guardar Sucursal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEmpleado && (
        <div className="modal-overlay">
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
                <span>{empleadoEditando ? "Nueva contraseña (opcional)" : "Contraseña"}</span>
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
                  onChange={e => setFormEmpleado(f => ({...f, rolId: e.target.value}))}
                >
                  <option value="">Selecciona</option>
                  {roles.map(rol => (
                    <option key={rol.idRol || rol.id} value={rol.idRol || rol.id}>
                      {rol.nombre}
                    </option>
                  ))}
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

      {modalError && (
        <div className="modal-error-overlay">
          <div className="modal-error-card" onClick={e => e.stopPropagation()}>
            <h2>Error</h2>
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


