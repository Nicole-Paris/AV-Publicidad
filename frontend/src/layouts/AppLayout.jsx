import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const links = [
  { to: "/punto-venta", label: "Punto de Venta", icon: "cart" },
  { to: "/pedidos", label: "Pedidos", icon: "doc" },
  { to: "/clientes", label: "Clientes", icon: "users" },
  { to: "/inventario", label: "Inventario", icon: "box" },
  { to: "/cortes-caja", label: "Caja y Reportes", icon: "money" },
  { to: "/reportes", label: "Reportes", icon: "chart" },
  { to: "/configuracion", label: "Configuración", icon: "gear" }
];

const icons = {
  cart: (
    <>
      <circle cx="9" cy="21" r="1.5" />
      <circle cx="19" cy="21" r="1.5" />
      <path d="M2.5 3h3l2.2 12.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.4L22 8H7" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h5" />
      <path d="M9.5 12h7" />
      <path d="M9.5 16h7" />
    </>
  ),
  users: (
    <>
      <path d="M16 19v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V19" />
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path d="M22 19v-1.5a3.5 3.5 0 0 0-3-3.5" />
      <path d="M16.5 4.3a3.5 3.5 0 0 1 0 6.4" />
    </>
  ),
  box: (
    <>
      <path d="M21 8.5 12 3 3 8.5 12 14z" />
      <path d="M3 8.5V16l9 5 9-5V8.5" />
      <path d="M12 14v7" />
    </>
  ),
  money: (
    <>
      <path d="M12 2v20" />
      <path d="M17 6.5c-1.2-1-2.8-1.5-5-1.5-3 0-5 1.4-5 3.6 0 5.2 10 2.3 10 7.2 0 2.1-2 3.2-5 3.2-2.1 0-3.8-.5-5.2-1.6" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V5" />
      <path d="M4 20h17" />
      <path d="M8 16V9" />
      <path d="M13 16V6" />
      <path d="M18 16v-4" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-2 .2 1.7 1.7 0 0 0-.9 1.7V22H10v-.2a1.7 1.7 0 0 0-.9-1.7 1.7 1.7 0 0 0-2-.2l-.2.1-2-3.4.1-.1A1.7 1.7 0 0 0 5.4 15 1.7 1.7 0 0 0 4 13.8H3.8v-3.6H4a1.7 1.7 0 0 0 1.4-1.2A1.7 1.7 0 0 0 5 7.1L4.9 7l2-3.4.2.1a1.7 1.7 0 0 0 2-.2A1.7 1.7 0 0 0 10 1.8V1h4v.8a1.7 1.7 0 0 0 .9 1.7 1.7 1.7 0 0 0 2 .2l.2-.1 2 3.4-.1.1a1.7 1.7 0 0 0-.4 1.9 1.7 1.7 0 0 0 1.4 1.2h.2v3.6H20a1.7 1.7 0 0 0-1.4 1.2z" />
    </>
  ),
  store: (
    <>
      <path d="M4 10h16" />
      <path d="M5 10l1-6h12l1 6" />
      <path d="M6 10v10h12V10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  logout: (
    <>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    </>
  ),
  chevronLeft: <path d="m15 18-6-6 6-6" />
};

function Icon({ name }) {
  return (
    <svg className="app-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

export function AppLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/punto-venta");
  }

  function goAccountSettings() {
    setUserMenuOpen(false);
    navigate("/configuracion");
  }

  function handleLogout() {
    setUserMenuOpen(false);
    logout();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">av</span>
          <strong>AV Publicidad</strong>
        </div>

        <nav className="nav-list">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              <span className="nav-icon">
                <Icon name={link.icon} />
              </span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button className="back-button" type="button" onClick={goBack} aria-label="Volver">
              <Icon name="chevronLeft" />
            </button>
            <strong>Punto de Venta</strong>
          </div>

          <div className="topbar-actions">
            <span className="branch-pill">
              <Icon name="store" />
              {session?.sucursal || "Sucursal Centro - Coatzacoalcos"}
            </span>
            <div className="user-menu-wrap">
              <button
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className="avatar-button"
                title="Menú de usuario"
                type="button"
                onClick={() => setUserMenuOpen((current) => !current)}
              >
                {(session?.nombre || "A").charAt(0)}
              </button>

              {userMenuOpen && (
                <div className="user-menu" role="menu">
                  <div className="user-menu-header">
                    <strong>{session?.nombre || "Usuario"}</strong>
                    <span>{session?.rol || "Sin rol"}</span>
                  </div>
                  <button type="button" role="menuitem" onClick={goAccountSettings}>
                    <Icon name="user" />
                    Configuración de la cuenta
                  </button>
                  <button type="button" role="menuitem" onClick={handleLogout}>
                    <Icon name="logout" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
