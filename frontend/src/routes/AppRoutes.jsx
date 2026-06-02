import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { AppLayout } from "../layouts/AppLayout.jsx";
import { DashboardPage } from "../pages/DashboardPage.jsx";
import { LoginPage } from "../pages/LoginPage.jsx";
import { PlaceholderPage } from "../pages/PlaceholderPage.jsx";
import { PuntoVentaPage } from "../pages/PuntoVentaPage.jsx";
import { InventarioPage } from "../pages/InventarioPage.jsx";
import { PedidosPage } from "../pages/PedidosPage.jsx";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
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
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="punto-venta" element={<PuntoVentaPage />} />
        <Route path="clientes" element={<PlaceholderPage title="Clientes" />} />
        <Route path="pedidos" element={<PedidosPage />} />
        <Route path="pagos" element={<PlaceholderPage title="Pagos" />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="reportes" element={<PlaceholderPage title="Reportes" />} />
        <Route path="materiales" element={<PlaceholderPage title="Materiales" />} />
        <Route path="servicios" element={<PlaceholderPage title="Servicios" />} />
        <Route path="empleados" element={<PlaceholderPage title="Empleados" />} />
        <Route path="cortes-caja" element={<PlaceholderPage title="Corte de caja" />} />
        <Route path="configuracion" element={<PlaceholderPage title="Configuracion" />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
