import axios, { type AxiosRequestConfig } from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
