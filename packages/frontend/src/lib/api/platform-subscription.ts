import apiClient from '../api-client';
import type {
  PlatformPlan,
  PlatformPlanName,
  PlatformSubscription,
} from '@/types/platform-subscription';

export const platformSubscriptionApi = {
  async getPlans() {
    const { data } = await apiClient.get<PlatformPlan[]>('/platform/plans');
    return data;
  },

  async getSubscription(organizationId?: string) {
    const { data } = await apiClient.get<PlatformSubscription | null>(
      '/platform/subscription',
      {
        params: organizationId ? { organizationId } : undefined,
      },
    );
    return data;
  },

  async createCheckout(planName: PlatformPlanName, organizationId?: string) {
    const { data } = await apiClient.post<{ url: string }>(
      '/platform/checkout',
      { planName },
      {
        params: organizationId ? { organizationId } : undefined,
      },
    );
    return data;
  },

  async createPortal(organizationId?: string) {
    const { data } = await apiClient.post<{ url: string }>(
      '/platform/portal',
      undefined,
      {
        params: organizationId ? { organizationId } : undefined,
      },
    );
    return data;
  },

  async cancelSubscription(organizationId?: string) {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      '/platform/cancel',
      undefined,
      {
        params: organizationId ? { organizationId } : undefined,
      },
    );
    return data;
  },
};
