import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.headers && config.method && !["get", "head", "options"].includes(config.method)) {
    config.headers["X-CSRF-Token"] = "tolab-csrf";
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (token: string | null, err: unknown | null = null) => {
  failedQueue.forEach((prom) => {
    if (err) prom.reject(err);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const isAuthEndpoint = originalRequest?.url?.includes("/api/v1/auth/login") ||
      originalRequest?.url?.includes("/api/v1/auth/register") ||
      originalRequest?.url?.includes("/api/v1/auth/refresh") ||
      originalRequest?.url?.includes("/api/v1/auth/logout");

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const store = useAuthStore.getState();
    if (!store.refreshToken) {
      store.logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const resp = await api.post("/api/v1/auth/refresh", {
        refresh_token: store.refreshToken,
      });
      const { access_token, refresh_token } = resp.data;
      store.setTokens(access_token, refresh_token);
      processQueue(access_token, null);
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(null, refreshErr);
      store.logout();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
