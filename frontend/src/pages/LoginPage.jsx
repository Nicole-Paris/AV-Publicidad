import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({
    correo: "admin@av.com",
    contrasena: "Admin123"
  });
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await login(form);
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
          <span className="brand-mark large">AV</span>
          <h1>AV Publicidad</h1>
          <p>Operacion, pedidos, pagos e inventario en un solo lugar.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <span className="eyebrow">Acceso</span>
            <h2>Iniciar sesion</h2>
          </div>

          {error && <p className="form-error">{error}</p>}

          <label>
            Correo
            <input
              autoComplete="email"
              name="correo"
              onChange={handleChange}
              type="email"
              value={form.correo}
            />
          </label>

          <label>
            Contrasena
            <input
              autoComplete="current-password"
              name="contrasena"
              onChange={handleChange}
              type="password"
              value={form.contrasena}
            />
          </label>

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
