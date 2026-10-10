import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { LoginResponse } from '../types/auth.types';

export const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag and queue to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Attach in-memory Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: 401 Silent Token Rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and not already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Do not attempt to refresh for auth endpoints themselves (e.g. login or refresh failed)
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue pending requests while token refresh is in flight
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        isRefreshing = false;
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        // Direct call to refresh endpoint without using interceptors
        const response = await axios.post<LoginResponse>(
          '/auth/refresh',
          null,
          {
            params: { refreshToken },
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Update Zustand store
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        // Resume queued requests
        processQueue(null, newAccessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Attempts a silent token refresh on initial app load if a stored refresh token exists.
 */
export async function attemptSilentRefresh(): Promise<boolean> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return false;

  try {
    const response = await axios.post<LoginResponse>(
      '/auth/refresh',
      null,
      {
        params: { refreshToken },
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    useAuthStore.getState().setTokens(accessToken, newRefreshToken);
    return true;
  } catch (err) {
    useAuthStore.getState().logout();
    return false;
  }
}
