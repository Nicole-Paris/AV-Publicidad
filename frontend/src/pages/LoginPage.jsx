import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { enviarCodigoRecuperacion, restablecerContrasena } from "../api/authApi.js";
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
  const [recoveryStep, setRecoveryStep] = useState("correo");
  const [recoveryForm, setRecoveryForm] = useState({
    correo: "",
    codigo: "",
    nuevaContrasena: ""
  });
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

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

  function openForgotModal() {
    setRecoveryStep("correo");
    setRecoveryForm({
      correo: form.correo,
      codigo: "",
      nuevaContrasena: ""
    });
    setRecoveryMessage("");
    setRecoveryError("");
    setShowForgotModal(true);
  }

  function closeForgotModal() {
    setShowForgotModal(false);
    setRecoveryLoading(false);
  }

  function handleRecoveryChange(event) {
    const { name, value } = event.target;
    setRecoveryForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSendRecoveryCode(event) {
    event.preventDefault();
    setRecoveryError("");
    setRecoveryMessage("");
    setRecoveryLoading(true);

    try {
      await enviarCodigoRecuperacion(recoveryForm.correo);
      setRecoveryStep("codigo");
      setRecoveryMessage("Te enviamos un codigo al correo registrado.");
    } catch (err) {
      setRecoveryError(err.message);
    } finally {
      setRecoveryLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setRecoveryError("");
    setRecoveryMessage("");
    setRecoveryLoading(true);

    try {
      await restablecerContrasena({
        correo: recoveryForm.correo,
        codigo: recoveryForm.codigo,
        nuevaContrasena: recoveryForm.nuevaContrasena
      });
      setForm((current) => ({ ...current, correo: recoveryForm.correo, contrasena: "" }));
      setRecoveryMessage("Contrasena actualizada. Ya puedes iniciar sesion.");
      setTimeout(() => closeForgotModal(), 1200);
    } catch (err) {
      setRecoveryError(err.message);
    } finally {
      setRecoveryLoading(false);
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
            onClick={openForgotModal}
            type="button"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      </section>

      {showForgotModal && (
        <div className="modal-error-overlay" onClick={closeForgotModal}>
          <div className="modal-error-card recovery-card" onClick={event => event.stopPropagation()}>
            <p className="modal-error-icon">!</p>
            <h2 className="modal-title">Recuperar contrasena</h2>
            {recoveryStep === "correo" ? (
              <form className="recovery-form" onSubmit={handleSendRecoveryCode}>
                <p className="modal-error-msg">
                  Escribe tu correo para recibir un codigo de recuperacion.
                </p>
                {recoveryError && <p className="form-error">{recoveryError}</p>}
                <label className="login-field recovery-email-field">
                  <input
                    autoComplete="email"
                    name="correo"
                    onChange={handleRecoveryChange}
                    placeholder="Correo Electronico"
                    type="email"
                    value={recoveryForm.correo}
                  />
                </label>
                <div className="modal-actions">
                  <button className="secondary-button" onClick={closeForgotModal} type="button">
                    Cancelar
                  </button>
                  <button className="primary-button" disabled={recoveryLoading} type="submit">
                    {recoveryLoading ? "Enviando..." : "Enviar codigo"}
                  </button>
                </div>
              </form>
            ) : (
              <form className="recovery-form" onSubmit={handleResetPassword}>
                {recoveryMessage && <p className="form-success">{recoveryMessage}</p>}
                {recoveryError && <p className="form-error">{recoveryError}</p>}
                <label className="login-field">
                  <input
                    inputMode="numeric"
                    maxLength="6"
                    name="codigo"
                    onChange={handleRecoveryChange}
                    placeholder="Codigo de 6 digitos"
                    value={recoveryForm.codigo}
                  />
                </label>
                <label className="login-field">
                  <input
                    autoComplete="new-password"
                    name="nuevaContrasena"
                    onChange={handleRecoveryChange}
                    placeholder="Nueva contrasena"
                    type="password"
                    value={recoveryForm.nuevaContrasena}
                  />
                </label>
                <div className="modal-actions">
                  <button
                    className="secondary-button"
                    disabled={recoveryLoading}
                    onClick={() => setRecoveryStep("correo")}
                    type="button"
                  >
                    Cambiar correo
                  </button>
                  <button className="primary-button" disabled={recoveryLoading} type="submit">
                    {recoveryLoading ? "Guardando..." : "Cambiar contrasena"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
