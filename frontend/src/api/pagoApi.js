import { apiRequest } from "./apiClient.js";

export function listarPagosPorPedido(pedidoId) {
  return apiRequest(`/pagos?pedidoId=${pedidoId}`);
}

export function crearPago(payload) {
  return apiRequest("/pagos", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// Agregado: listarTodosPagos
export function listarTodosPagos() {
  return apiRequest("/pagos");
}