import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { AppIcon } from "../components/AppIcon.jsx";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({
    correo: "",
    contrasena: ""
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

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
        contrasena: form.contrasena
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
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}

          <label className="login-field">
            <input
              autoComplete="email"
              aria-label="Correo Electronico"
              name="correo"
              onChange={handleChange}
              placeholder="Correo Electronico "
              type="email"
              value={form.correo}
            />
          </label>

          <label className="login-field password-field">
            <input
              autoComplete="current-password"
              aria-label="Contrasena"
              name="contrasena"
              onChange={handleChange}
              placeholder="Contraseña"
              type={showPassword ? "text" : "password"}
              value={form.contrasena}
            />
            <button
              aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              <AppIcon name={showPassword ? "eyeOff" : "eye"} size={22} />
            </button>
          </label>

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Entrando..." : "Iniciar Sesion"}
          </button>

          <button
            className="forgot-password"
            onClick={() => setShowForgotModal(true)}
            type="button"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      </section>

      {showForgotModal && (
        <div className="modal-error-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-error-card" onClick={event => event.stopPropagation()}>
            <p className="modal-error-icon">!</p>
            <p className="modal-error-msg">
              Solicita a un administrador que restablezca tu contrasena desde Configuracion, Empleados y Editar empleado.
            </p>
            <button className="primary-button" onClick={() => setShowForgotModal(false)} type="button">
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
