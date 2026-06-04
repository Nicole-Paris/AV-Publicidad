import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { AppIcon } from "../components/AppIcon.jsx";

const links = [
  { to: "/punto-venta", label: "Punto de Venta", icon: "cart" },
  { to: "/pedidos", label: "Pedidos", icon: "doc" },
  { to: "/clientes", label: "Clientes", icon: "users" },
  { to: "/inventario", label: "Inventario", icon: "box" },
  { to: "/servicios", label: "Servicios", icon: "chart" },
  { to: "/cortes-caja", label: "Caja y Reportes", icon: "money" },
  { to: "/reportes", label: "Reportes", icon: "chart" },
  { to: "/configuracion", label: "Configuración", icon: "gear" }
];

export function AppLayout() {
  const { session, logout, cambiarSucursal } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const sucursalesSesion = session?.sucursales || [];

  function goBack() {
    navigate("/dashboard");
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
                <AppIcon name={link.icon} />
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
              <AppIcon name="arrowLeft" size={20} />
            </button>
            <strong>Punto de Venta</strong>
          </div>

          <div className="topbar-actions">
            <span className="branch-pill">
              <AppIcon name="store" />
              {sucursalesSesion.length > 1 ? (
                <select
                  aria-label="Sucursal activa"
                  onChange={(event) => cambiarSucursal(Number(event.target.value))}
                  value={session?.sucursalIdSucursal || session?.sucursalId || ""}
                >
                  {sucursalesSesion.map((sucursal) => (
                    <option key={sucursal.idSucursal} value={sucursal.idSucursal}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                session?.sucursal || "Sucursal Centro"
              )}
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
                    <div className="user-menu-avatar">{(session?.nombre || "A").charAt(0)}</div>
                    <strong>{session?.nombre || "Admin Sistema AV"}</strong>
                    <span>{session?.correo || session?.rol || "Administrador"}</span>
                  </div>
                  <button type="button" role="menuitem" onClick={goAccountSettings}>
                    <AppIcon name="user" />
                    Configuración de la cuenta
                  </button>
                  <button type="button" role="menuitem" onClick={handleLogout}>
                    <AppIcon name="logout" />
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
