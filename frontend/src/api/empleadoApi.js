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

export function actualizarEmpleado(id, payload) {
  return apiRequest(`/empleados/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function eliminarEmpleado(id, deletedBy) {
  const query = deletedBy ? `?deletedBy=${deletedBy}` : "";
  return apiRequest(`/empleados/${id}${query}`, {
    method: "DELETE"
  });
}

export function listarRoles() {
  return apiRequest("/roles");
}

export function crearRol(payload) {
  return apiRequest("/roles", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
