import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearSession, getStoredSession, storeSession } from "../api/apiClient.js";
import { loginRequest, logoutRequest } from "../api/authApi.js";
import { listarCortesPorEmpleado } from "../api/corteCajaApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleSessionExpired() {
      clearSession();
      setSession(null);
    }

    window.addEventListener("av_session_expired", handleSessionExpired);
    return () => window.removeEventListener("av_session_expired", handleSessionExpired);
  }, []);

  const login = useCallback(async function login(credentials) {
    setLoading(true);
    try {
      const auth = await loginRequest(credentials);
      const nextSession = {
        token: auth.token,
        tipoToken: auth.tipoToken,
        empleadoId: auth.empleadoId,
        nombre: auth.nombre,
        correo: auth.correo,
        rolId: auth.rolId,
        rol: auth.rol,
        sucursalIdSucursal: auth.sucursalIdSucursal,
        sucursal: auth.sucursal,
        sucursales: auth.sucursales || [
          {
            idSucursal: auth.sucursalIdSucursal,
            nombre: auth.sucursal
          }
        ].filter((sucursal) => sucursal.idSucursal)
      };

      storeSession(nextSession);
      setSession(nextSession);
      return nextSession;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async function logout() {
    try {
      if (session?.empleadoId) {
        const cortes = await listarCortesPorEmpleado(session.empleadoId);
        const abierta = (cortes || []).find(c => !c.horaFin);
        if (abierta) {
          const err = new Error("Tienes una caja asignada abierta puedes cerrar sesión pero la caja seguirá abierta hasta que se cierre.");
          err.tipo = "caja_abierta_advertencia";
          throw err;
        }
      }
    } catch (err) {
      // propaga el error para que la UI lo muestre
      throw err;
    }

    try {
      await logoutRequest();
    } finally {
      clearSession();
      setSession(null);
    }
  }, [session]);

  const cambiarSucursal = useCallback(function cambiarSucursal(sucursalId) {
    setSession((current) => {
      if (!current) {
        return current;
      }

      const sucursal = (current.sucursales || []).find(
        (item) => Number(item.idSucursal) === Number(sucursalId)
      );

      if (!sucursal) {
        return current;
      }

      const nextSession = {
        ...current,
        sucursalIdSucursal: sucursal.idSucursal,
        sucursalId: sucursal.idSucursal,
        sucursal: sucursal.nombre
      };
      storeSession(nextSession);
      return nextSession;
    });
  }, []);

  const actualizarSucursales = useCallback(function actualizarSucursales(sucursales) {
    setSession((current) => {
      if (!current) {
        return current;
      }

      const actuales = current.sucursales || [];
      const mismas =
        actuales.length === sucursales.length &&
        actuales.every((item, index) =>
          Number(item.idSucursal) === Number(sucursales[index]?.idSucursal) &&
          item.nombre === sucursales[index]?.nombre
        );

      if (mismas) {
        return current;
      }

      const nextSession = {
        ...current,
        sucursales
      };
      storeSession(nextSession);
      return nextSession;
    });
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
      cambiarSucursal,
      actualizarSucursales
    }),
    [session, loading, login, logout, cambiarSucursal, actualizarSucursales]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
