import { apiRequest } from "./apiClient.js";

export function listarClientes() {
  return apiRequest("/clientes");
}

export function crearCliente(payload) {
  return apiRequest("/clientes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function actualizarCliente(id, payload) {
  return apiRequest(`/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function eliminarCliente(id) {
  return apiRequest(`/clientes/${id}`, {
    method: "DELETE"
  });
}

export function listarServicios() {
  return apiRequest("/servicios");
}

export function crearServicio(payload) {
  return apiRequest("/servicios", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function actualizarServicio(id, payload) {
  return apiRequest(`/servicios/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

// Categorías de servicio (nombre singular usado en algunas páginas)
export function listarCategoriaServicio() {
  return apiRequest("/categorias-servicio");
}

export function crearCategoriaServicio(payload) {
  return apiRequest("/categorias-servicio", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function actualizarCategoriaServicio(id, payload) {
  return apiRequest(`/categorias-servicio/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

// Servicios - materiales
export function listarServiciosMateriales() {
  return apiRequest("/servicios-materiales");
}

export function crearServicioMaterial(payload) {
  return apiRequest("/servicios-materiales", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function actualizarServicioMaterial(id, payload) {
  return apiRequest(`/servicios-materiales/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function eliminarServicioMaterial(id) {
  return apiRequest(`/servicios-materiales/${id}`, {
    method: "DELETE"
  });
}

export function listarSucursales() {
  return apiRequest("/sucursales");
}

// Agregado: obtenerCliente
export function obtenerCliente(id) {
  return apiRequest(`/clientes/${id}`);
}
