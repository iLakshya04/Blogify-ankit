import axios from "axios";

const TOKEN_KEY = "blogify_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const defaultApiUrl =
  typeof window !== "undefined" &&
  window.location.port !== "5173" &&
  window.location.port !== "4173"
    ? "/api"
    : "http://localhost:5000/api";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
});

client.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const token = getStoredToken();
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    const isAuthPage = pathname === "/login" || pathname === "/signup";
    const isSessionCheck = error.config?.url === "/auth/me";

    if (status === 401 && token && !isAuthPage) {
      clearStoredToken();
      window.dispatchEvent(
        new CustomEvent("blogify:unauthorized", {
          detail: { shouldRedirect: !isSessionCheck },
        })
      );
    }

    return Promise.reject(error);
  }
);

export default client;
