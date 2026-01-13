import apiClient from '../api-client';
import type { User, LoginCredentials, RegisterData } from '@/types/auth';

export const authApi = {
  async login(credentials: LoginCredentials) {
    const { data } = await apiClient.post<{ user: User }>('/auth/login', credentials);
    return data;
  },

  async register(userData: RegisterData) {
    const { data } = await apiClient.post<{ user: User }>('/auth/register', userData);
    return data;
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async getProfile() {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  async refresh() {
    const { data } = await apiClient.post<{ user: User }>('/auth/refresh');
    return data;
  },
};
