import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { AppIcon } from "../components/AppIcon.jsx";
import { clearSession } from "../api/apiClient.js";
import { logoutRequest } from "../api/authApi.js";
import { listarSucursales } from "../api/configuracionApi.js";
import { esEmpleado } from "../auth/permissions.js";

const links = [
  { to: "/punto-venta", label: "Punto de Venta", icon: "cart" },
  { to: "/pedidos", label: "Pedidos", icon: "doc" },
  { to: "/clientes", label: "Clientes", icon: "users" },
  { to: "/inventario", label: "Inventario", icon: "box" },
  { to: "/servicios", label: "Servicios", icon: "print" },
  { to: "/cortes-caja", label: "Caja", icon: "money" },
  { to: "/reportes", label: "Reportes", icon: "chart" },
  { to: "/configuracion", label: "Configuración", icon: "gear" }
];

export function AppLayout() {
  const { session, logout, cambiarSucursal, actualizarSucursales } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [logoutWarning, setLogoutWarning] = useState("");
  const [logoUrl, setLogoUrl] = useState(localStorage.getItem("av_logo_url") || "");
  const sucursalesSesion = session?.sucursales || [];
  const sucursalActivaId = session?.sucursalIdSucursal || session?.sucursalId || "";
  const rolSesion = (session?.rol || "").toLowerCase();
  const linksVisibles = esEmpleado(session)
    ? links.filter((link) =>
        [
          "/pedidos",
          "/clientes",
          "/inventario",
          "/configuracion"
        ].includes(link.to)
      )
    : links;
  const rutaInicio = esEmpleado(session) ? "/pedidos" : "/dashboard";
  const sucursalesSesionCount = sucursalesSesion.length;

  useEffect(() => {
    function onLogoChange() {
      setLogoUrl(localStorage.getItem("av_logo_url") || "");
    }
    window.addEventListener("av_logo_changed", onLogoChange);
    return () => window.removeEventListener("av_logo_changed", onLogoChange);
  }, []);

  useEffect(() => {
    let active = true;
    const esAdministrador = rolSesion === "administrador";
    const tieneOpciones = sucursalesSesionCount > 1;

    if (!session || !esAdministrador || tieneOpciones) {
      return () => {
        active = false;
      };
    }

    async function cargarSucursalesAdmin() {
      try {
        const sucursales = await listarSucursales();
        if (!active || !Array.isArray(sucursales) || sucursales.length === 0) {
          return;
        }

        actualizarSucursales(
          sucursales.map((sucursal) => ({
            idSucursal: sucursal.idSucursal || sucursal.id,
            nombre: sucursal.nombre
          }))
        );
      } catch {
        // Si no se pueden cargar, se mantiene la sucursal de la sesión actual.
      }
    }

    cargarSucursalesAdmin();
    return () => {
      active = false;
    };
  }, [Boolean(session), rolSesion, sucursalesSesionCount, actualizarSucursales]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(e) {
      const wrap = document.querySelector(".user-menu-wrap");
      if (wrap && !wrap.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!branchMenuOpen) return;
    function handleClickOutsideBranch(e) {
      const wrap = document.querySelector(".branch-menu-wrap");
      if (wrap && !wrap.contains(e.target)) {
        setBranchMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideBranch);
    return () => document.removeEventListener("mousedown", handleClickOutsideBranch);
  }, [branchMenuOpen]);

  const isDashboard = location.pathname === "/dashboard" || location.pathname === "/";
  const pageTitle = isDashboard
    ? "Panel Principal"
    : linksVisibles.find((link) => location.pathname.startsWith(link.to))?.label || "AV Publicidad";

  function handleBranchChange(sucursal) {
    cambiarSucursal(Number(sucursal.idSucursal));
    setBranchMenuOpen(false);
  }

  function goAccountSettings() {
    setUserMenuOpen(false);
    navigate("/configuracion");
  }

  async function handleLogout() {
    setUserMenuOpen(false);
    try {
      await logout();
    } catch (err) {
      if (err?.tipo === "caja_abierta_advertencia") {
        setLogoutWarning(err.message);
        try {
          await logoutRequest();
        } finally {
          clearSession();
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        }
      } else {
        setLogoutError(err.message || "No puedes cerrar sesión en este momento.");
      }
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          type="button"
          className="brand brand-button"
          onClick={() => navigate(rutaInicio)}
          aria-label={esEmpleado(session) ? "Ir a pedidos" : "Ir al panel principal"}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              style={{
                width:40, height:40, borderRadius:10,
                objectFit:"contain", background:"#fff"
              }}
              onError={e => { e.target.style.display="none"; }}
            />
          ) : (
            <span className="brand-mark">av</span>
          )}
          <strong>AV Publicidad</strong>
        </button>

        <nav className="nav-list">
          {linksVisibles.map((link) => (
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
            <div className="page-badge">
              <span className="eyebrow">Sección</span>
              <strong>{pageTitle}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="branch-menu-wrap">
              <button
                aria-expanded={branchMenuOpen}
                aria-haspopup="menu"
                className="branch-pill"
                onClick={() => {
                  setUserMenuOpen(false);
                  setBranchMenuOpen((current) => !current);
                }}
                type="button"
              >
                <AppIcon name="store" />
                <span>{session?.sucursal || "Sucursal Centro"}</span>
                <span className="branch-chevron" aria-hidden="true" />
              </button>

              {branchMenuOpen && (
                <div className="branch-menu" role="menu">
                  <div className="branch-menu-header">
                    <strong>Sucursal activa</strong>
                    <span>
                      {sucursalesSesion.length > 1
                        ? "Puedes cambiar a otra sucursal ligada a tu usuario."
                        : "Solo hay una sucursal disponible en esta sesión."}
                    </span>
                  </div>
                  {(sucursalesSesion.length > 0
                    ? sucursalesSesion
                    : [{ idSucursal: sucursalActivaId, nombre: session?.sucursal || "Sucursal Centro" }]
                  ).map((sucursal) => {
                    const activa = Number(sucursal.idSucursal) === Number(sucursalActivaId);
                    return (
                      <button
                        className={activa ? "branch-menu-option active" : "branch-menu-option"}
                        disabled={activa}
                        key={sucursal.idSucursal}
                        onClick={() => handleBranchChange(sucursal)}
                        type="button"
                      >
                        <AppIcon name="store" />
                        <span>{sucursal.nombre}</span>
                        <strong>{activa ? "Actual" : "Cambiar"}</strong>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="user-menu-wrap">
              <button
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className="avatar-button"
                title="Menú de usuario"
                type="button"
                onClick={() => {
                  setBranchMenuOpen(false);
                  setUserMenuOpen((current) => !current);
                }}
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
      {/* Modal de error de logout */}
      {logoutError && (
        <div className="modal-error-overlay" onClick={() => setLogoutError("")}>
          <div className="modal-error-card" onClick={e => e.stopPropagation()}>
            <p className="modal-error-icon">⚠</p>
            <p className="modal-error-msg">{logoutError}</p>
            <button className="primary-button" onClick={() => setLogoutError("")}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {logoutWarning && (
        <div className="modal-error-overlay">
          <div className="modal-error-card" onClick={e => e.stopPropagation()}>
            <p className="modal-error-icon">⚠</p>
            <p className="modal-error-msg">{logoutWarning}</p>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setLogoutWarning("");
                window.location.href = "/login";
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
