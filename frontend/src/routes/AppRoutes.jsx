import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { AppLayout } from "../layouts/AppLayout.jsx";
import { DashboardPage } from "../pages/DashboardPage.jsx";
import { LoginPage } from "../pages/LoginPage.jsx";
import { PlaceholderPage } from "../pages/PlaceholderPage.jsx";
import { PuntoVentaPage } from "../pages/PuntoVentaPage.jsx";
import { InventarioPage } from "../pages/InventarioPage.jsx";
import { PedidosPage } from "../pages/PedidosPage.jsx";
import { CorteCajaPage } from "../pages/CorteCajaPage.jsx";
import { ServiciosPage } from "../pages/ServiciosPage.jsx";
import { ClientesPage } from "../pages/ClientesPage.jsx";
import { ConfiguracionPage } from "../pages/ConfiguracionPage.jsx";
import { ReportesPage } from "../pages/ReportesPage.jsx";
import { esEmpleado, puedeAccederRuta } from "../auth/permissions.js";

function rutaInicio(session) {
  return esEmpleado(session) ? "/pedidos" : "/dashboard";
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, session } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!puedeAccederRuta(session, location.pathname)) {
    return <Navigate to={rutaInicio(session)} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, session } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={rutaInicio(session)} replace />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<InicioRedirect />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="punto-venta" element={<PuntoVentaPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="pedidos" element={<PedidosPage />} />
        <Route path="pagos" element={<PlaceholderPage title="Pagos" />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="materiales" element={<PlaceholderPage title="Materiales" />} />
        <Route path="servicios" element={<ServiciosPage />} />
        <Route path="empleados" element={<PlaceholderPage title="Empleados" />} />
        <Route path="cortes-caja" element={<CorteCajaPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
      </Route>

      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  );
}

function InicioRedirect() {
  const { session } = useAuth();
  return <Navigate to={rutaInicio(session)} replace />;
}

function FallbackRedirect() {
  const { session } = useAuth();
  return <Navigate to={rutaInicio(session)} replace />;
}
