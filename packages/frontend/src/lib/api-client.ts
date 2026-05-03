import axios, { type AxiosRequestConfig } from 'axios';

// Use /api proxy in production to avoid third-party cookie issues
// In development, use the direct API URL
const isServer = typeof window === 'undefined';
export const AUTH_EXPIRED_EVENT = 'auth:expired';
const baseURL = isServer
  ? process.env.NEXT_PUBLIC_API_URL // SSR uses direct URL
  : '/api'; // Client uses proxy to avoid CORS/cookie issues

const apiClient = axios.create({
  baseURL,
  withCredentials: true, // CRITICAL: sends cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<void> | null = null;

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/auth/refresh', {})
      .then(() => undefined)
      .catch((error) => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const refreshBlocked = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/logout'].some(
      (path) => originalRequest?.url?.includes(path),
    );

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !refreshBlocked
    ) {
      originalRequest._retry = true;

      try {
        await refreshSession();
        return apiClient(originalRequest);
      } catch {
        // ProtectedRoute/AdminRoute will redirect once auth state is cleared.
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
