import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/clientes", label: "Clientes" },
  { to: "/pedidos", label: "Pedidos" },
  { to: "/pagos", label: "Pagos" },
  { to: "/inventario", label: "Inventario" },
  { to: "/materiales", label: "Materiales" },
  { to: "/servicios", label: "Servicios" },
  { to: "/empleados", label: "Empleados" },
  { to: "/cortes-caja", label: "Corte caja" },
  { to: "/configuracion", label: "Configuracion" }
];

export function AppLayout() {
  const { session, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">AV</span>
          <div>
            <strong>AV Publicidad</strong>
            <small>{session?.rol || "Usuario"}</small>
          </div>
        </div>

        <nav className="nav-list">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Sesion activa</span>
            <strong>{session?.nombre}</strong>
          </div>
          <button className="ghost-button" type="button" onClick={logout}>
            Cerrar sesion
          </button>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
