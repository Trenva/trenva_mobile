import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "./config";
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "../auth/tokens";

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshInFlight: Promise<{ access: string; refresh: string }> | null = null;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";

    const isRefreshEndpoint = requestUrl.includes("/api/auth/token/refresh/");

    if (!originalRequest || originalRequest._retry || status !== 401 || isRefreshEndpoint) {
      return Promise.reject(error);
    }

    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await clearAuthTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshInFlight) {
        refreshInFlight = (async () => {
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/api/auth/token/refresh/`,
            { refresh: refreshToken },
            { timeout: 15000 },
          );

          const nextAccessToken = refreshResponse.data?.access as string | undefined;
          const nextRefreshToken = (refreshResponse.data?.refresh as string | undefined) ?? refreshToken;

          if (!nextAccessToken) {
            throw new Error("Refresh did not return access token.");
          }

          await setAuthTokens(nextAccessToken, nextRefreshToken);
          return { access: nextAccessToken, refresh: nextRefreshToken };
        })();
      }

      const nextTokens = await refreshInFlight;
      refreshInFlight = null;

      if (!nextTokens.access) {
        await clearAuthTokens();
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = `Bearer ${nextTokens.access}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      refreshInFlight = null;
      await clearAuthTokens();
      return Promise.reject(refreshError);
    }
  },
);
