import { apiRequest } from "./apiClient.js";

export function listarCortesCaja() {
  return apiRequest("/cortes-caja");
}

export function crearCorteCaja(payload) {
  return apiRequest("/cortes-caja", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function actualizarCorteCaja(id, payload) {
  return apiRequest(`/cortes-caja/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
