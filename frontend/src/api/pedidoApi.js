import { apiRequest } from "./apiClient.js";

export function crearPedido(payload) {
  return apiRequest("/pedidos", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function actualizarPedido(id, payload) {
  return apiRequest(`/pedidos/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function crearDetallePedido(payload) {
  return apiRequest("/detalles-pedido", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
