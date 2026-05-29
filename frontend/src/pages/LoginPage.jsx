import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { listarSucursales } from "../api/sucursalApi.js";
import { useAuth } from "../auth/AuthContext.jsx";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({
    correo: "",
    contrasena: "",
    sucursalIdSucursal: ""
  });
  const [sucursales, setSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function cargarSucursales() {
      try {
        const data = await listarSucursales();
        if (!active) {
          return;
        }

        setSucursales(data);
        setForm((current) => ({
          ...current,
          sucursalIdSucursal: current.sucursalIdSucursal || String(data[0]?.idSucursal || "")
        }));
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoadingSucursales(false);
        }
      }
    }

    cargarSucursales();

    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await login({
        correo: form.correo,
        contrasena: form.contrasena,
        sucursalIdSucursal: Number(form.sucursalIdSucursal)
      });
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-copy">
          <span className="login-logo">av</span>
          <h1>AV Publicidad</h1>
          <p>Sistema de Gestión POS/ERP</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}

          <label className="login-field">
            <input
              autoComplete="email"
              aria-label="Correo Electrónico"
              name="correo"
              onChange={handleChange}
              placeholder="Correo Electrónico *"
              type="email"
              value={form.correo}
            />
          </label>

          <label className="login-field">
            <input
              autoComplete="current-password"
              aria-label="Contraseña"
              name="contrasena"
              onChange={handleChange}
              placeholder="Contraseña *"
              type="password"
              value={form.contrasena}
            />
          </label>

          <label className="login-field select-field">
            <span>Sucursal *</span>
            <select
              aria-label="Sucursal"
              disabled={loadingSucursales || !sucursales.length}
              name="sucursalIdSucursal"
              onChange={handleChange}
              value={form.sucursalIdSucursal}
            >
              {!sucursales.length && (
                <option value="">
                  {loadingSucursales ? "Cargando sucursales..." : "Sin sucursales disponibles"}
                </option>
              )}
              {sucursales.map((sucursal) => (
                <option key={sucursal.idSucursal} value={sucursal.idSucursal}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </label>

          <button className="primary-button" disabled={loading || loadingSucursales} type="submit">
            {loading ? "Entrando..." : "Iniciar Sesión"}
          </button>

          <a className="forgot-password" href="/login">
            ¿Olvidaste tu contraseña?
          </a>
        </form>
      </section>
    </main>
  );
}
