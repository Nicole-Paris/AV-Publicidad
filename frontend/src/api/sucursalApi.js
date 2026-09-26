import { apiRequest } from "./apiClient.js";

export function listarSucursales() {
  return apiRequest("/sucursales");
}
