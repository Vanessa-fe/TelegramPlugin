import apiClient from '../api-client';

export type ContactMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export const contactApi = {
  async sendMessage(payload: ContactMessage) {
    const { data } = await apiClient.post<{ success: true }>('/contact', payload);
    return data;
  },
};
