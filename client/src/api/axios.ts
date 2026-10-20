import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _zentroRetried?: boolean;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let refreshInFlight: Promise<void> | null = null;

const doesNotRefresh = (url?: string) =>
  !url || ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"].some((path) => url.includes(path));

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const request = error.config as RetryableRequestConfig | undefined;
    if (error.response?.status !== 401 || !request || request._zentroRetried || doesNotRefresh(request.url)) {
      return Promise.reject(error);
    }

    request._zentroRetried = true;
    try {
      if (!refreshInFlight) {
        refreshInFlight = api.post("/auth/refresh").then(() => undefined).finally(() => {
          refreshInFlight = null;
        });
      }
      await refreshInFlight;
      return api.request(request);
    } catch {
      useAuthStore.getState().clearUser();
      return Promise.reject(error);
    }
  }
);
