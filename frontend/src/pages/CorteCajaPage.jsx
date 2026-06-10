import { useEffect, useMemo, useState } from "react";
import { actualizarCorteCaja, crearCorteCaja, listarCortesCaja } from "../api/corteCajaApi.js";
import { listarEmpleados } from "../api/empleadoApi.js";
import { listarTodosPagos } from "../api/pagoApi.js";
import { listarPedidos } from "../api/pedidoApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { esAdministrador, esEmpleado } from "../auth/permissions.js";

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
  return partes.length > 1 ? `${partes[0]}.${partes.slice(1).join("")}` : limpio;
}

function toAmount(value) {
  return Number(value || 0);
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
        if (active) setError(err.message);
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

  const pagosDelDia = useMemo(() => {
    return pagos.filter(
      (pago) => {
        const pedido = pedidos.find((item) => Number(item.idPedido) === Number(pago.pedidoId));
        return pago.fecha === fechaFiltro &&
          Number(pago.empleadoIdEmpleado) === Number(session?.empleadoId) &&
          (!sucursalActivaId || Number(pedido?.sucursalId) === Number(sucursalActivaId));
      }
    );
  }, [fechaFiltro, pagos, pedidos, session, sucursalActivaId]);

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

  const totalPagos = pagosDelDia.reduce((total, pago) => total + toAmount(pago.monto), 0);
  const saldoBase = corteAbierto ? toAmount(corteAbierto.saldoInicial) : toAmount(saldoInicial);
  const saldoEsperado = saldoBase + totalPagos;
  const diferencia = saldoReal === "" ? 0 : toAmount(saldoReal) - saldoEsperado;
  // Solo el admin puede abrir cajas. Si es admin requiere asignar empleado destino.
  const canAbrir = isAdmin && !loading && !saving && !corteAbierto && toAmount(saldoInicial) >= 0 && saldoInicial !== "" && Boolean(assignedEmpleadoId);
  const canCerrar = !loading && !saving && corteAbierto && saldoReal !== "";

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
      setError(err.message);
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
    if (String(corteAbierto.empleadoId) !== String(session?.empleadoId)) {
      setError("Solo el empleado asignado puede cerrar este corte de caja.");
      setSaving(false);
      return;
    }

    try {
      const horaFinActual = nowTime();
      const horaInicio = corteAbierto.horaInicio || "00:00:00";
      const horaFin = horaFinActual < horaInicio ? "23:59:59" : horaFinActual;

      await actualizarCorteCaja(corteAbierto.idCorteCaja, {
        fecha: corteAbierto.fecha,
        horaInicio,
        horaFin,
        saldoInicial: Number(corteAbierto.saldoInicial).toFixed(2),
        saldoEsperado: saldoEsperado.toFixed(2),
        saldoReal: toAmount(saldoReal).toFixed(2),
        diferenciaSaldo: diferencia.toFixed(2),
        descripcion,
        empleadoId: session.empleadoId,
        createdBy: corteAbierto.createdBy || session.empleadoId,
        updatedBy: session.empleadoId
      });
      setSaldoReal("");
      setDescripcion("");
      await recargar();
      setSuccess("Corte cerrado correctamente.");
    } catch (err) {
      setError(err.message);
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
              type="date"
              value={fechaFiltro}
              onChange={(event) => setFechaFiltro(event.target.value)}
            />
          </label>
          <div className={corteAbierto ? "cash-status open" : "cash-status closed"}>
            {corteAbierto ? "Caja abierta" : "Sin caja abierta"}
          </div>
        </div>
      )}

      {isAdmin ? (
        <div className="cash-grid">
          {/* Panel Abrir/Cerrar caja (admin) */}
          <section className="cash-panel">
            <h2>{corteAbierto ? "Cerrar caja" : "Abrir caja"}</h2>

            {corteAbierto ? (
              <div className="cash-current">
                <div>
                  <span>Inicio</span>
                  <strong>{formatTime(corteAbierto.horaInicio)}</strong>
                </div>
                <div>
                  <span>Saldo inicial</span>
                  <strong>{money(corteAbierto.saldoInicial)}</strong>
                </div>
              </div>
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

            {corteAbierto && (
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
              disabled={corteAbierto ? !canCerrar : !canAbrir}
              onClick={corteAbierto ? cerrarCorte : abrirCorte}
              type="button"
            >
              {saving ? "Guardando..." : corteAbierto ? "Cerrar caja" : "Abrir caja"}
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
            {corteAbierto ? (
              <>
                <div className="cash-current">
                  <div>
                    <span>Inicio</span>
                    <strong>{formatTime(corteAbierto.horaInicio)}</strong>
                  </div>
                  <div>
                    <span>Saldo inicial</span>
                    <strong>{money(corteAbierto.saldoInicial)}</strong>
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

          {corteAbierto && (
            <section className="cash-panel">
              <h2>Resumen del dia</h2>
              <div className="cash-summary">
                <div>
                  <span>Saldo inicial</span>
                  <strong>{money(corteAbierto.saldoInicial)}</strong>
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
            cortesDelDia.map((corte) => (
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
      </section>
    </section>
  );
}
