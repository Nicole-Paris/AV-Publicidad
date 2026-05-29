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
    const message = data?.message || data?.error || "No se pudo completar la solicitud";
    throw new Error(message);
  }

  return data;
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
