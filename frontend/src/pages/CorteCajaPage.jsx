import { useEffect, useMemo, useState } from "react";
import { actualizarCorteCaja, crearCorteCaja, listarCortesCaja } from "../api/corteCajaApi.js";
import { listarEmpleados } from "../api/empleadoApi.js";
import { listarTodosPagos } from "../api/pagoApi.js";
import { listarPedidos } from "../api/pedidoApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { esAdministrador, esEmpleado } from "../auth/permissions.js";
import { Pagination } from "../components/Pagination.jsx";

const HISTORIAL_PAGE_SIZE = 15;

function money(value) {
  return new Intl.NumberFormat("es-MX", {
    currency: "MXN",
    style: "currency"
  }).format(Number(value || 0));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 8);
}

function formatTime(value) {
  return value ? value.slice(0, 5) : "-";
}

function normalizeMoney(value) {
  const limpio = String(value || "").replace(/[^\d.]/g, "");
  const partes = limpio.split(".");
  const entero = (partes[0] || "").slice(0, 8);
  if (partes.length > 1) {
    return `${entero}.${partes.slice(1).join("").slice(0, 2)}`;
  }
  return entero;
}

function toAmount(value) {
  return Number(value || 0);
}

function friendlyCashError(error) {
  const message = error?.message || String(error || "");
  if (message.toLowerCase().includes("valor numérico fuera de límites")) {
    return "El monto es demasiado grande. Usa máximo 8 dígitos y 2 decimales.";
  }
  if (message.toLowerCase().includes("valor numerico fuera de limites")) {
    return "El monto es demasiado grande. Usa máximo 8 dígitos y 2 decimales.";
  }
  return message;
}

export function CorteCajaPage() {
  const { session } = useAuth();
  const [assignedEmpleadoId, setAssignedEmpleadoId] = useState("");
  const isAdmin = esAdministrador(session);
  const isEmpleado = esEmpleado(session);

  const [cortes, setCortes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState(today());
  const [saldoInicial, setSaldoInicial] = useState("");
  const [saldoReal, setSaldoReal] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cajaSeleccionadaId, setCajaSeleccionadaId] = useState("");
  const [paginaHistorial, setPaginaHistorial] = useState(1);

  useEffect(() => {
    let active = true;

    async function cargar() {
      setLoading(true);
      setError("");

      try {
        const [cortesData, pagosData, empleadosData, pedidosData] = await Promise.all([
          listarCortesCaja(),
          listarTodosPagos(),
          listarEmpleados(),
          listarPedidos()
        ]);
        if (!active) return;
        setCortes((cortesData || []).slice().sort((a, b) => Number(b.idCorteCaja) - Number(a.idCorteCaja)));
        setPagos(pagosData || []);
        setEmpleados(empleadosData || []);
        // no asignar por defecto al admin; dejar vacío para que el admin elija
        setAssignedEmpleadoId("");
        setPedidos(pedidosData || []);
      } catch (err) {
        if (active) setError(friendlyCashError(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    cargar();

    return () => {
      active = false;
    };
  }, []);

  const sucursalActivaId = session?.sucursalIdSucursal || session?.sucursalId;

  // para empleados buscar su corte abierto (sin filtrar por fecha)
  const corteAbierto = useMemo(() => {
    if (isEmpleado) {
      return cortes.find(c => Number(c.empleadoId) === Number(session?.empleadoId) && !c.horaFin);
    }
    return cortes.find(
      (corte) =>
        corte.fecha === fechaFiltro &&
        Number(corte.empleadoId) === Number(session?.empleadoId) &&
        !corte.horaFin
    );
  }, [cortes, fechaFiltro, session, isEmpleado]);

  const cortesDelDia = useMemo(() => {
    if (isEmpleado) {
      return cortes.filter(c =>
        Number(c.empleadoId) === Number(session?.empleadoId) &&
        c.fecha === fechaFiltro
      );
    }
    return cortes.filter((corte) => {
      const empleado = empleados.find((item) => Number(item.idEmpleado) === Number(corte.empleadoId));
      return corte.fecha === fechaFiltro &&
      (!sucursalActivaId || Number(empleado?.sucursalIdSucursal) === Number(sucursalActivaId));
    });
  }, [cortes, empleados, fechaFiltro, sucursalActivaId, isEmpleado, session]);

  const cortesHistorialPaginados = useMemo(() => {
    const inicio = (paginaHistorial - 1) * HISTORIAL_PAGE_SIZE;
    return cortesDelDia.slice(inicio, inicio + HISTORIAL_PAGE_SIZE);
  }, [cortesDelDia, paginaHistorial]);

  useEffect(() => {
    setPaginaHistorial(1);
  }, [fechaFiltro, sucursalActivaId]);

  useEffect(() => {
    const ultimaPagina = Math.max(1, Math.ceil(cortesDelDia.length / HISTORIAL_PAGE_SIZE));
    if (paginaHistorial > ultimaPagina) {
      setPaginaHistorial(ultimaPagina);
    }
  }, [cortesDelDia.length, paginaHistorial]);

  const cajasAbiertas = useMemo(() => {
    return cortes.filter((corte) => {
      if (corte.horaFin) {
        return false;
      }
      if (isEmpleado) {
        return Number(corte.empleadoId) === Number(session?.empleadoId);
      }
      const empleado = empleados.find((item) => Number(item.idEmpleado) === Number(corte.empleadoId));
      return !sucursalActivaId || Number(empleado?.sucursalIdSucursal) === Number(sucursalActivaId);
    });
  }, [cortes, empleados, sucursalActivaId, isEmpleado, session]);

  const cajaSeleccionada = useMemo(() => {
    return cajasAbiertas.find((corte) => Number(corte.idCorteCaja) === Number(cajaSeleccionadaId)) || null;
  }, [cajasAbiertas, cajaSeleccionadaId]);

  const corteEnRevision = isAdmin ? cajaSeleccionada : corteAbierto;

  const pagosDelDia = useMemo(() => {
    const empleadoIdResumen = corteEnRevision?.empleadoId || session?.empleadoId;
    const fechaResumen = corteEnRevision?.fecha || fechaFiltro;

    return pagos.filter(
      (pago) => {
        const pedido = pedidos.find((item) => Number(item.idPedido) === Number(pago.pedidoId));
        return pago.fecha === fechaResumen &&
          Number(pago.empleadoIdEmpleado) === Number(empleadoIdResumen) &&
          (!sucursalActivaId || Number(pedido?.sucursalId) === Number(sucursalActivaId));
      }
    );
  }, [fechaFiltro, pagos, pedidos, session, sucursalActivaId, corteEnRevision]);

  const totalPagos = pagosDelDia.reduce((total, pago) => total + toAmount(pago.monto), 0);
  const saldoBase = corteEnRevision ? toAmount(corteEnRevision.saldoInicial) : toAmount(saldoInicial);
  const saldoEsperado = saldoBase + totalPagos;
  const diferencia = saldoReal === "" ? 0 : toAmount(saldoReal) - saldoEsperado;
  // Solo el admin puede abrir cajas. Si es admin requiere asignar empleado destino.
  const canAbrir = isAdmin && !loading && !saving && !corteEnRevision && toAmount(saldoInicial) >= 0 && saldoInicial !== "" && Boolean(assignedEmpleadoId);
  const canCerrar = !loading && !saving && corteEnRevision && saldoReal !== "";

  async function recargar() {
    const [cortesData, pagosData, empleadosData, pedidosData] = await Promise.all([
      listarCortesCaja(),
      listarTodosPagos(),
      listarEmpleados(),
      listarPedidos()
    ]);
    setCortes((cortesData || []).slice().sort((a, b) => Number(b.idCorteCaja) - Number(a.idCorteCaja)));
    setPagos(pagosData || []);
    setEmpleados(empleadosData || []);
    setPedidos(pedidosData || []);
  }

  function nombreEmpleado(id) {
    const empleado = empleados.find((current) => Number(current.idEmpleado) === Number(id));
    if (!empleado) {
      return `Empleado ${id || "-"}`;
    }

    return [empleado.nombre, empleado.apellidoPaterno, empleado.apellidoMaterno]
      .filter(Boolean)
      .join(" ");
  }

  function pagosDeCorte(corte) {
    if (!corte) {
      return [];
    }
    return pagos.filter((pago) => {
      const pedido = pedidos.find((item) => Number(item.idPedido) === Number(pago.pedidoId));
      return pago.fecha === corte.fecha &&
        Number(pago.empleadoIdEmpleado) === Number(corte.empleadoId) &&
        (!sucursalActivaId || Number(pedido?.sucursalId) === Number(sucursalActivaId));
    });
  }

  function totalPagosDeCorte(corte) {
    return pagosDeCorte(corte).reduce((total, pago) => total + toAmount(pago.monto), 0);
  }

  async function abrirCorte() {
    if (!canAbrir) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // crear el corte; el admin debe elegir a qué empleado se le asigna
      await crearCorteCaja({
        fecha: fechaFiltro,
        horaInicio: nowTime(),
        saldoInicial: toAmount(saldoInicial).toFixed(2),
        descripcion,
        empleadoId: assignedEmpleadoId || session.empleadoId,
        createdBy: session.empleadoId
      });
      setSaldoInicial("");
      setDescripcion("");
      await recargar();
      setSuccess("Corte abierto correctamente.");
    } catch (err) {
      setError(friendlyCashError(err));
    } finally {
      setSaving(false);
    }
  }

  async function cerrarCorte() {
    if (!canCerrar) return;
    setSaving(true);
    setError("");
    setSuccess("");

    // Solo el empleado asignado puede cerrar su corte
    if (!isAdmin && String(corteEnRevision.empleadoId) !== String(session?.empleadoId)) {
      setError("Solo el empleado asignado puede cerrar este corte de caja.");
      setSaving(false);
      return;
    }

    try {
      const horaFinActual = nowTime();
      const horaInicio = corteEnRevision.horaInicio || "00:00:00";
      const horaFin = horaFinActual < horaInicio ? "23:59:59" : horaFinActual;

      await actualizarCorteCaja(corteEnRevision.idCorteCaja, {
        fecha: corteEnRevision.fecha,
        horaInicio,
        horaFin,
        saldoInicial: Number(corteEnRevision.saldoInicial).toFixed(2),
        saldoEsperado: saldoEsperado.toFixed(2),
        saldoReal: toAmount(saldoReal).toFixed(2),
        diferenciaSaldo: diferencia.toFixed(2),
        descripcion,
        empleadoId: corteEnRevision.empleadoId,
        createdBy: corteEnRevision.createdBy || session.empleadoId,
        updatedBy: session.empleadoId
      });
      setSaldoReal("");
      setDescripcion("");
      setCajaSeleccionadaId("");
      await recargar();
      setSuccess("Corte cerrado correctamente.");
    } catch (err) {
      setError(friendlyCashError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-stack cash-page">
      <div className="page-header">
        <div>
        </div>
      </div>

      {/* selector de empleado ahora dentro del formulario de Abrir caja (ver más abajo) */}

      {(error || success) && (
        <div className={error ? "pos-alert error" : "pos-alert success"}>{error || success}</div>
      )}

      {isAdmin && (
        <div className="cash-toolbar">
          <label>
            <span>Fecha de corte</span>
            <input
              disabled
              type="date"
              value={fechaFiltro}
            />
          </label>
          <div className={cajasAbiertas.length > 0 ? "cash-status open" : "cash-status closed"}>
            {cajasAbiertas.length > 0 ? `${cajasAbiertas.length} caja${cajasAbiertas.length === 1 ? "" : "s"} abierta${cajasAbiertas.length === 1 ? "" : "s"}` : "Sin caja abierta"}
          </div>
        </div>
      )}

      {isAdmin ? (
        <div className="cash-grid">
          {/* Panel Abrir/Cerrar caja (admin) */}
          <section className="cash-panel">
            <h2>{corteEnRevision ? "Revisar y cerrar caja" : "Abrir caja"}</h2>

            {corteEnRevision ? (
              <>
                <div className="cash-current">
                  <div>
                    <span>Empleado</span>
                    <strong>{nombreEmpleado(corteEnRevision.empleadoId)}</strong>
                  </div>
                  <div>
                    <span>Inicio</span>
                    <strong>{formatTime(corteEnRevision.horaInicio)}</strong>
                  </div>
                  <div>
                    <span>Saldo inicial</span>
                    <strong>{money(corteEnRevision.saldoInicial)}</strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        setCajaSeleccionadaId("");
                        setSaldoReal("");
                        setDescripcion("");
                      }}
                    >
                      Abrir otra caja
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Select de empleado dentro del formulario de Abrir caja */}
                <label className="pos-field floating">
                  <span>Asignar a empleado</span>
                  <select
                    value={assignedEmpleadoId}
                    onChange={e => setAssignedEmpleadoId(e.target.value)}
                  >
                    <option value="">Selecciona un empleado</option>
                    {empleados.map(emp => (
                      <option key={emp.idEmpleado} value={emp.idEmpleado}>
                        {[emp.nombre, emp.apellidoPaterno, emp.apellidoMaterno].filter(Boolean).join(" ")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="pos-field floating money-field">
                  <span>Saldo inicial</span>
                  <input
                    inputMode="decimal"
                    type="text"
                    value={saldoInicial}
                    onChange={(event) => setSaldoInicial(normalizeMoney(event.target.value))}
                  />
                </label>
              </>
            )}

            {corteEnRevision && (
              <label className="pos-field floating money-field">
                <span>Saldo real</span>
                <input
                  inputMode="decimal"
                  type="text"
                  value={saldoReal}
                  onChange={(event) => setSaldoReal(normalizeMoney(event.target.value))}
                />
              </label>
            )}

            <label className="pos-field floating">
              <span>Descripcion</span>
              <input
                maxLength={100}
                type="text"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
              />
            </label>

            <button
              className="primary-button cash-action"
              disabled={corteEnRevision ? !canCerrar : !canAbrir}
              onClick={corteEnRevision ? cerrarCorte : abrirCorte}
              type="button"
            >
              {saving ? "Guardando..." : corteEnRevision ? "Cerrar caja" : "Abrir caja"}
            </button>
          </section>

          {/* Resumen del dia (solo admin) */}
          <section className="cash-panel">
            <h2>Resumen del dia</h2>
            <div className="cash-summary">
              <div>
                <span>Saldo inicial</span>
                <strong>{money(saldoBase)}</strong>
              </div>
              <div>
                <span>Pagos recibidos</span>
                <strong>{money(totalPagos)}</strong>
              </div>
              <div>
                <span>Saldo esperado</span>
                <strong>{money(saldoEsperado)}</strong>
              </div>
              <div className={diferencia < 0 ? "negative" : "positive"}>
                <span>Diferencia</span>
                <strong>{money(diferencia)}</strong>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* Empleado: Mi caja + Resumen (lado a lado) */
        <div className="cash-grid">
          <section className="cash-panel">
            <h2>Mi caja</h2>
            {corteEnRevision ? (
              <>
                <div className="cash-current">
                  <div>
                    <span>Inicio</span>
                    <strong>{formatTime(corteEnRevision.horaInicio)}</strong>
                  </div>
                  <div>
                    <span>Saldo inicial</span>
                    <strong>{money(corteEnRevision.saldoInicial)}</strong>
                  </div>
                </div>

                <label className="pos-field floating money-field">
                  <span>Saldo real</span>
                  <input
                    inputMode="decimal"
                    type="text"
                    value={saldoReal}
                    onChange={(event) => setSaldoReal(normalizeMoney(event.target.value))}
                  />
                </label>

                <label className="pos-field floating">
                  <span>Descripcion</span>
                  <input
                    maxLength={100}
                    type="text"
                    value={descripcion}
                    onChange={(event) => setDescripcion(event.target.value)}
                  />
                </label>

                <button
                  className="primary-button cash-action"
                  disabled={!canCerrar}
                  onClick={cerrarCorte}
                  type="button"
                >
                  {saving ? "Guardando..." : "Cerrar caja"}
                </button>
              </>
            ) : (
              <div style={{ color: "#6b7280" }}>No tienes una caja asignada actualmente.</div>
            )}
          </section>

          {corteEnRevision && (
            <section className="cash-panel">
              <h2>Resumen del dia</h2>
              <div className="cash-summary">
                <div>
                  <span>Saldo inicial</span>
                  <strong>{money(corteEnRevision.saldoInicial)}</strong>
                </div>
                <div>
                  <span>Pagos recibidos</span>
                  <strong>{money(totalPagos)}</strong>
                </div>
                <div>
                  <span>Saldo esperado</span>
                  <strong>{money(saldoEsperado)}</strong>
                </div>
                <div className={diferencia < 0 ? "negative" : "positive"}>
                  <span>Diferencia</span>
                  <strong>{money(diferencia)}</strong>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      <section className="cash-panel">
        <div className="tab-section-header">
          <h2>Cajas abiertas</h2>
          <span className="cash-count">{cajasAbiertas.length} abiertas</span>
        </div>
        <div className="cash-history">
          {cajasAbiertas.length === 0 ? (
            <p>No hay cajas abiertas actualmente.</p>
          ) : (
            cajasAbiertas.map((corte) => {
              const pagosCorte = totalPagosDeCorte(corte);
              const esperado = toAmount(corte.saldoInicial) + pagosCorte;
              return (
                <article
                  className="cash-history-card"
                  key={corte.idCorteCaja}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setCajaSeleccionadaId(corte.idCorteCaja);
                    setSaldoReal("");
                    setDescripcion(corte.descripcion || "");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setCajaSeleccionadaId(corte.idCorteCaja);
                      setSaldoReal("");
                      setDescripcion(corte.descripcion || "");
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    borderColor: Number(cajaSeleccionadaId) === Number(corte.idCorteCaja) ? "#ff5733" : undefined
                  }}
                >
                  <div className="cash-history-main">
                    <strong>#{corte.idCorteCaja}</strong>
                    <span>Fecha: {corte.fecha}</span>
                    <span>Inicio: {formatTime(corte.horaInicio)}</span>
                    <span>Empleado: {nombreEmpleado(corte.empleadoId)}</span>
                  </div>
                  <div>
                    <span>Saldo inicial</span>
                    <strong>{money(corte.saldoInicial)}</strong>
                  </div>
                  <div>
                    <span>Pagos recibidos</span>
                    <strong>{money(pagosCorte)}</strong>
                  </div>
                  <div>
                    <span>Esperado actual</span>
                    <strong>{money(esperado)}</strong>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="cash-panel">
        <div className="tab-section-header">
          <h2>Pagos del dia</h2>
          <span className="cash-count">{pagosDelDia.length} registros</span>
        </div>
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Hora</th>
                <th>Forma</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              {pagosDelDia.length === 0 ? (
                <tr>
                  <td colSpan="6">No hay pagos registrados para esta fecha.</td>
                </tr>
              ) : (
                pagosDelDia.map((pago) => (
                  <tr key={pago.idPago}>
                    <td>#{pago.pedidoId}</td>
                    <td>{formatTime(pago.horaPago)}</td>
                    <td>{pago.formaPago}</td>
                    <td>{pago.conceptoPago}</td>
                    <td>{money(pago.monto)}</td>
                    <td>{pago.referencia || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cash-panel">
        <div className="tab-section-header">
          <h2>Historial de cortes</h2>
          <span className="cash-count">{cortesDelDia.length} cortes</span>
        </div>
        <div className="cash-history">
          {cortesDelDia.length === 0 ? (
            <p>No hay cortes registrados para esta fecha.</p>
          ) : (
            cortesHistorialPaginados.map((corte) => (
              <article className="cash-history-card" key={corte.idCorteCaja}>
                <div className="cash-history-main">
                  <strong>#{corte.idCorteCaja}</strong>
                  <span>Fecha: {corte.fecha}</span>
                  <span>{formatTime(corte.horaInicio)} - {formatTime(corte.horaFin)}</span>
                  <span>Realizado por: {nombreEmpleado(corte.createdBy)}</span>
                  <span>Empleado del corte: {nombreEmpleado(corte.empleadoId)}</span>
                </div>
                <div>
                  <span>Esperado</span>
                  <strong>{money(corte.saldoEsperado)}</strong>
                </div>
                <div>
                  <span>Real</span>
                  <strong>{money(corte.saldoReal)}</strong>
                </div>
                <div className={Number(corte.diferenciaSaldo || 0) < 0 ? "negative" : "positive"}>
                  <span>Diferencia</span>
                  <strong>{money(corte.diferenciaSaldo)}</strong>
                </div>
              </article>
            ))
          )}
        </div>
        <Pagination
          page={paginaHistorial}
          pageSize={HISTORIAL_PAGE_SIZE}
          total={cortesDelDia.length}
          onPageChange={setPaginaHistorial}
          disabled={loading}
        />
      </section>

    </section>
  );
}
