import { Fragment, useEffect, useMemo, useState } from "react";
import { crearCliente, listarClientes } from "../api/catalogApi.js";
import { listarEmpleados } from "../api/empleadoApi.js";
import { useAuth } from "../auth/AuthContext.jsx";

function normalizarTexto(value) {
  return (value || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function nombreCliente(cliente) {
  return [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno]
    .filter(Boolean)
    .join(" ");
}

function money(value) {
  return new Intl.NumberFormat("es-MX", {
    currency: "MXN",
    style: "currency"
  }).format(value || 0);
}

export function ClientesPage() {
  const { session } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");
  const [buscar, setBuscar] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCredito, setFiltroCredito] = useState("");
  const [modalCliente, setModalCliente] = useState(false);
  const [clienteExpandido, setClienteExpandido] = useState(null);
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

  async function cargarClientes() {
    setLoading(true);
    try {
      const [data, empleadosData] = await Promise.all([listarClientes(), listarEmpleados()]);
      setClientes(Array.isArray(data) ? data : []);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
    } catch (err) {
      setModalError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function cargar() {
      setLoading(true);
      try {
        const [data, empleadosData] = await Promise.all([listarClientes(), listarEmpleados()]);
        if (!active) {
          return;
        }
        setClientes(Array.isArray(data) ? data : []);
        setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
      } catch (err) {
        if (active) {
          setModalError(err.message || String(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    cargar();
    return () => {
      active = false;
    };
  }, []);

  function limpiarMontoPositivo(value) {
    const limpio = value.replace(/[^\d.]/g, "");
    const partes = limpio.split(".");
    return partes.length > 1 ? `${partes[0]}.${partes.slice(1).join("")}` : limpio;
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

  function resetClienteForm() {
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
  }

  async function guardarCliente() {
    if (!formCliente.nombre.trim()) {
      setModalError("Escribe el nombre del cliente.");
      return;
    }
    if (!formCliente.apellidoPaterno.trim()) {
      setModalError("Escribe el apellido paterno del cliente.");
      return;
    }
    if (!formCliente.apellidoMaterno.trim()) {
      setModalError("Escribe el apellido materno del cliente.");
      return;
    }
    if (!formCliente.telefono.trim()) {
      setModalError("Escribe el telefono del cliente.");
      return;
    }

    setSaving(true);
    try {
      const razonSocial = formCliente.razonSocial.trim() || [
        formCliente.nombre,
        formCliente.apellidoPaterno,
        formCliente.apellidoMaterno
      ].filter(Boolean).join(" ");

      await crearCliente({
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

      await cargarClientes();
      resetClienteForm();
      setModalCliente(false);
      setSuccess("Cliente agregado correctamente.");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setModalError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  const clientesFiltrados = useMemo(() => {
    const q = normalizarTexto(buscar.trim());

    return clientes
      .filter((cliente) => !filtroTipo || cliente.tipo === filtroTipo)
      .filter((cliente) => {
        if (!filtroCredito) {
          return true;
        }
        return filtroCredito === "conCredito"
          ? Boolean(cliente.tieneCredito)
          : !cliente.tieneCredito;
      })
      .filter((cliente) => {
        if (!q) {
          return true;
        }

        const texto = [
          nombreCliente(cliente),
          cliente.telefono,
          cliente.rfc,
          cliente.razonSocial,
          cliente.codigoPostal
        ].map(normalizarTexto).join(" ");

        return texto.includes(q);
      });
  }, [clientes, buscar, filtroTipo, filtroCredito]);

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
          <span className="cash-count">{clientesFiltrados.length} clientes</span>
          <button className="primary-button" disabled={loading} onClick={() => setModalCliente(true)} type="button">
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {success && <div className="pos-alert success">{success}</div>}

      <div className="inv-toolbar clients-toolbar">
        <input
          disabled={loading}
          onChange={(event) => setBuscar(event.target.value)}
          placeholder="Buscar por nombre, telefono, RFC o razon social"
          value={buscar}
        />
        <select disabled={loading} onChange={(event) => setFiltroTipo(event.target.value)} value={filtroTipo}>
          <option value="">Todos los tipos</option>
          <option value="Frecuente">Frecuentes</option>
          <option value="No frecuente">No frecuentes</option>
        </select>
        <select disabled={loading} onChange={(event) => setFiltroCredito(event.target.value)} value={filtroCredito}>
          <option value="">Todos los creditos</option>
          <option value="conCredito">Con credito</option>
          <option value="sinCredito">Sin credito</option>
        </select>
      </div>

      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Telefono</th>
              <th>Credito</th>
              <th>RFC</th>
              <th>Razon social</th>
              <th>Direccion</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((cliente) => (
              <Fragment key={cliente.idCliente}>
                <tr key={cliente.idCliente}>
                  <td>{cliente.idCliente}</td>
                  <td>
                    <strong>{nombreCliente(cliente)}</strong>
                    <br />
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      CP {cliente.codigoPostal || "-"}
                    </span>
                  </td>
                  <td>
                    <span className={cliente.tipo === "Frecuente" ? "inv-badge ok" : "inv-badge neutral"}>
                      {cliente.tipo}
                    </span>
                  </td>
                  <td>{cliente.telefono || "-"}</td>
                  <td>
                    {cliente.tieneCredito ? (
                      <div className="client-credit-cell">
                        <span className="inv-badge warn">Con credito</span>
                        <small>
                          {money(cliente.creditoActual)} / {money(cliente.limiteCredito)}
                        </small>
                      </div>
                    ) : (
                      <span className="inv-badge neutral">Sin credito</span>
                    )}
                  </td>
                  <td>{cliente.rfc || "-"}</td>
                  <td>{cliente.razonSocial || "-"}</td>
                  <td>{cliente.direccion || "-"}</td>
                  <td>
                    <button
                      aria-label="Ver auditoria del cliente"
                      className="audit-toggle"
                      onClick={() => setClienteExpandido(clienteExpandido === cliente.idCliente ? null : cliente.idCliente)}
                      type="button"
                    >
                      {clienteExpandido === cliente.idCliente ? "▲" : "▼"}
                    </button>
                  </td>
                </tr>
                {clienteExpandido === cliente.idCliente && (
                  <tr className="audit-row" key={`${cliente.idCliente}-audit`}>
                    <td colSpan={9}>
                      <div className="audit-grid">
                        <div><span>Registrado por</span><strong>{nombreEmpleado(cliente.createdBy)}</strong></div>
                        <div><span>Registro</span><strong>{fechaHora(cliente.createdAt)}</strong></div>
                        <div><span>Editado por</span><strong>{nombreEmpleado(cliente.updatedBy)}</strong></div>
                        <div><span>Ultima edicion</span><strong>{fechaHora(cliente.updatedAt)}</strong></div>
                        <div><span>Eliminado por</span><strong>{nombreEmpleado(cliente.deletedBy)}</strong></div>
                        <div><span>Eliminacion</span><strong>{fechaHora(cliente.deletedAt)}</strong></div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!loading && clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={8} style={{ color: "#64748b", padding: 24, textAlign: "center" }}>
                  No hay clientes con esos filtros.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={8} style={{ color: "#64748b", padding: 24, textAlign: "center" }}>
                  Cargando clientes...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalCliente && (
        <div className="modal-overlay" onClick={() => setModalCliente(false)}>
          <div className="modal-card customer-modal" onClick={(event) => event.stopPropagation()}>
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
                    onChange={updateClienteForm}
                    type="text"
                    value={formCliente.limiteCredito}
                  />
                </label>
              )}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="ghost-button" onClick={() => setModalCliente(false)} type="button">
                Cancelar
              </button>
              <button className="primary-button" disabled={saving} onClick={guardarCliente} type="button">
                {saving ? "Guardando..." : "Guardar Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalError && (
        <div className="modal-error-overlay" onClick={() => setModalError("")}>
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
