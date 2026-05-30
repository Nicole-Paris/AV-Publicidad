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
