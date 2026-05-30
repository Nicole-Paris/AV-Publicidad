import { NavLink, Outlet } from "react-router-dom";
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

export function AppLayout() {
  const { session, logout } = useAuth();

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
              <span className={`nav-icon ${link.icon}`} aria-hidden="true" />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <span aria-hidden="true">‹</span>
            <strong>Punto de Venta</strong>
          </div>

          <div className="topbar-actions">
            <span className="branch-pill">
              <span aria-hidden="true">▤</span>
              {session?.sucursal || "Sucursal Centro - Coatzacoalcos"}
            </span>
            <button className="avatar-button" title="Cerrar sesión" type="button" onClick={logout}>
              {(session?.nombre || "A").charAt(0)}
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
