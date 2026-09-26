import { apiBlobRequest, apiRequest } from "./apiClient.js";

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

export function listarPedidos() {
  return apiRequest("/pedidos");
}

export function obtenerPedido(id) {
  return apiRequest(`/pedidos/${id}`);
}

export function listarDetallesPedido(pedidoId) {
  return apiRequest(`/detalles-pedido?pedidoId=${pedidoId}`);
}

export function descargarNotaPedidoPdf(pedidoId) {
  return apiBlobRequest(`/pedidos/${pedidoId}/nota-pdf`);
}
