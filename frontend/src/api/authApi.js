import { apiRequest } from "./apiClient.js";

export function loginRequest(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export function logoutRequest() {
  return apiRequest("/auth/logout", {
    method: "POST"
  });
}
