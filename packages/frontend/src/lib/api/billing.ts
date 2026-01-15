import apiClient from '../api-client';
import type { StripeStatus } from '@/types/billing';

export const billingApi = {
  async getStripeStatus(organizationId?: string) {
    const { data } = await apiClient.get<StripeStatus>('/billing/stripe/status', {
      params: organizationId ? { organizationId } : undefined,
    });
    return data;
  },

  async createStripeConnectLink(organizationId?: string) {
    const { data } = await apiClient.post<{ url: string }>(
      '/billing/stripe/connect',
      undefined,
      {
        params: organizationId ? { organizationId } : undefined,
      }
    );
    return data;
  },

  async createStripeLoginLink(organizationId?: string) {
    const { data } = await apiClient.post<{ url: string }>(
      '/billing/stripe/login',
      undefined,
      {
        params: organizationId ? { organizationId } : undefined,
      }
    );
    return data;
  },
};
