import axios from "axios";

function resolveApiBaseUrl() {
  if (typeof window !== "undefined") {
    return "/api";
  }

  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
}

export const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("token") || localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  // Skip reCAPTCHA verification for student portal web
  config.headers["x-app-platform"] = "mobile";
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const d = response.data;
    if (d && typeof d === 'object' && 'success' in d && 'data' in d) {
      response.data = d.data;
    }
    return response;
  },
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === "/login";
      const isDayPassParams = window.location.search.includes("dayPassToken");
      if (!isAuthPage && !isDayPassParams) {
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
