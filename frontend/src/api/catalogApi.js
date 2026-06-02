import { apiRequest } from "./apiClient.js";

export function listarClientes() {
  return apiRequest("/clientes");
}

export function listarServicios() {
  return apiRequest("/servicios");
}

export function listarCategoriasServicio() {
  return apiRequest("/categorias-servicio");
}

export function crearCategoriaServicio(payload) {
  return apiRequest("/categorias-servicio", {
    method: "POST",
    body: JSON.stringify(payload)
  });
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
