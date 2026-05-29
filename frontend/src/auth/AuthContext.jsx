import { createContext, useContext, useMemo, useState } from "react";
import { clearSession, getStoredSession, storeSession } from "../api/apiClient.js";
import { loginRequest, logoutRequest } from "../api/authApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [loading, setLoading] = useState(false);

  async function login(credentials) {
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
        rol: auth.rol
      };

      storeSession(nextSession);
      setSession(nextSession);
      return nextSession;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      clearSession();
      setSession(null);
    }
  }

  const value = useMemo(
    () => ({
      session,
      loading,
      isAuthenticated: Boolean(session?.token),
      login,
      logout
    }),
    [session, loading]
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
