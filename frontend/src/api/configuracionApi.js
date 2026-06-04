import { apiRequest } from "./apiClient.js";

export function listarSucursales() {
  return apiRequest("/sucursales");
}
export function crearSucursal(payload) {
  return apiRequest("/sucursales", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
export function listarGlobalValues() {
  return apiRequest("/global-values");
}
export function crearGlobalValue(payload) {
  return apiRequest("/global-values", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
export function actualizarGlobalValue(id, payload) {
  return apiRequest(`/global-values/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}