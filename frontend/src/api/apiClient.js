const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8083";

export async function apiRequest(path, options = {}) {
  const session = getStoredSession();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearSession();
      window.dispatchEvent(new Event("av_session_expired"));
    }

    const fieldErrors = data?.errors
      ? Object.entries(data.errors)
          .map(([field, message]) => `${field}: ${message}`)
          .join(". ")
      : "";
    const message = fieldErrors
      || data?.message
      || data?.error
      || (response.status === 401 || response.status === 403
        ? "Tu sesión expiró o no tiene permisos. Inicia sesión nuevamente."
        : "No se pudo completar la solicitud");
    throw new Error(message);
  }

  return data;
}

export async function apiBlobRequest(path, options = {}) {
  const session = getStoredSession();
  const headers = new Headers(options.headers || {});

  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearSession();
      window.dispatchEvent(new Event("av_session_expired"));
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    const message = data?.message
      || data?.error
      || (response.status === 401 || response.status === 403
        ? "Tu sesión expiró o no tiene permisos. Inicia sesión nuevamente."
        : "No se pudo completar la solicitud");
    throw new Error(message);
  }

  return response.blob();
}

export function getStoredSession() {
  const value = localStorage.getItem("av_session");
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    localStorage.removeItem("av_session");
    return null;
  }
}

export function storeSession(session) {
  localStorage.setItem("av_session", JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem("av_session");
}
