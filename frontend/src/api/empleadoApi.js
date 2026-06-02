import { apiRequest } from "./apiClient.js";

export function listarEmpleados() {
  return apiRequest("/empleados");
}
