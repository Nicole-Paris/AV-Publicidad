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

export async function listarCortesPorEmpleado(empleadoId) {
  // Reusa la lista completa y filtra en el cliente para evitar dependencias del backend
  const cortes = await listarCortesCaja();
  return (cortes || []).filter((corte) => String(corte.empleadoId) === String(empleadoId));
}
