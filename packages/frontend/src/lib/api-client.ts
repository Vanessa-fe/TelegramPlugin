import axios, { type AxiosRequestConfig } from 'axios';

// Use /api proxy in production to avoid third-party cookie issues
// In development, use the direct API URL
const isServer = typeof window === 'undefined';
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
      // Try refresh token
      try {
        await apiClient.post('/auth/refresh', {});
        // Retry original request
        return apiClient(originalRequest);
      } catch {
        // Refresh failed - let the error bubble up
        // ProtectedRoute will handle redirect for protected pages
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
