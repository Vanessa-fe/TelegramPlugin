import apiClient from '../api-client';
import type {
  User,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  UpdatePasswordData,
} from '@/types/auth';

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

  async updateProfile(dto: UpdateProfileData) {
    const { data } = await apiClient.patch<{ user: User }>('/auth/me', dto);
    return data;
  },

  async updatePassword(dto: UpdatePasswordData) {
    const { data } = await apiClient.patch<{ user: User }>(
      '/auth/password',
      dto
    );
    return data;
  },
};
