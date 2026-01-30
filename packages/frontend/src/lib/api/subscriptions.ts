import apiClient from '../api-client';
import type { Subscription, SubscriptionWithRelations, CreateSubscriptionDto, UpdateSubscriptionDto } from '@/types/subscription';

export const subscriptionsApi = {
  async findAll(organizationId?: string) {
    const { data } = await apiClient.get<SubscriptionWithRelations[]>('/subscriptions', {
      params: organizationId ? { organizationId } : undefined,
    });
    return data;
  },

  async findOne(id: string) {
    const { data } = await apiClient.get<SubscriptionWithRelations>(`/subscriptions/${id}`);
    return data;
  },

  async create(dto: CreateSubscriptionDto) {
    const { data } = await apiClient.post<Subscription>('/subscriptions', dto);
    return data;
  },

  async update(id: string, dto: UpdateSubscriptionDto) {
    const { data } = await apiClient.patch<Subscription>(`/subscriptions/${id}`, dto);
    return data;
  },
};
