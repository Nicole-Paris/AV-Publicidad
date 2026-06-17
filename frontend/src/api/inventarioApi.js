import { apiRequest } from "./apiClient.js";

export function listarCategoriasMaterial() {
  return apiRequest("/categorias-material");
}
export function crearCategoriaMaterial(payload) {
  return apiRequest("/categorias-material", { method: "POST", body: JSON.stringify(payload) });
}
export function actualizarCategoriaMaterial(id, payload) {
  return apiRequest(`/categorias-material/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}
export function listarMateriales() {
  return apiRequest("/materiales");
}
export function crearMaterial(payload) {
  return apiRequest("/materiales", { method: "POST", body: JSON.stringify(payload) });
}
export function actualizarMaterial(id, payload) {
  return apiRequest(`/materiales/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}
export function listarInventarios() {
  return apiRequest("/inventarios");
}
export function crearInventario(payload) {
  return apiRequest("/inventarios", { method: "POST", body: JSON.stringify(payload) });
}
export function actualizarInventario(id, payload) {
  return apiRequest(`/inventarios/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}
export function listarMovimientos() {
  return apiRequest("/movimientos-inventario");
}
export function crearMovimiento(payload) {
  return apiRequest("/movimientos-inventario", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
