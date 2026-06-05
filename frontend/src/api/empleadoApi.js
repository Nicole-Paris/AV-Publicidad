import { apiRequest } from "./apiClient.js";

export function listarEmpleados() {
  return apiRequest("/empleados");
}

export function crearEmpleado(payload) {
  return apiRequest("/empleados", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listarRoles() {
  return apiRequest("/roles");
}
