import { apiRequest } from "./apiClient.js";

export function listarClientes() {
  return apiRequest("/clientes");
}

export function listarServicios() {
  return apiRequest("/servicios");
}

export function listarSucursales() {
  return apiRequest("/sucursales");
}

// Agregado: obtenerCliente
export function obtenerCliente(id) {
  return apiRequest(`/clientes/${id}`);
}

export function crearServicio(payload) {
  return apiRequest("/servicios", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
