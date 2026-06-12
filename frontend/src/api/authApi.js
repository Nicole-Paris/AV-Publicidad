import { apiRequest } from "./apiClient.js";

export function loginRequest(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export function logoutRequest() {
  return apiRequest("/auth/logout", {
    method: "POST"
  });
}

export function enviarCodigoRecuperacion(correo) {
  return apiRequest("/auth/recuperacion/codigo", {
    method: "POST",
    body: JSON.stringify({ correo })
  });
}

export function validarCodigoRecuperacion(payload) {
  return apiRequest("/auth/recuperacion/validar-codigo", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function restablecerContrasena(payload) {
  return apiRequest("/auth/recuperacion/restablecer", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
