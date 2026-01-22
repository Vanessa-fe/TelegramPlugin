import apiClient from '../api-client';
import type {
  Entitlement,
  CreateEntitlementDto,
  UpdateEntitlementDto,
} from '@/types/entitlement';

export const entitlementsApi = {
  async findAll(params?: {
    subscriptionId?: string;
    customerId?: string;
    entitlementKey?: string;
  }) {
    const { data } = await apiClient.get<Entitlement[]>('/entitlements', {
      params,
    });
    return data;
  },

  async findOne(id: string) {
    const { data } = await apiClient.get<Entitlement>(`/entitlements/${id}`);
    return data;
  },

  async create(dto: CreateEntitlementDto) {
    const { data } = await apiClient.post<Entitlement>('/entitlements', dto);
    return data;
  },

  async update(id: string, dto: UpdateEntitlementDto) {
    const { data } = await apiClient.patch<Entitlement>(
      `/entitlements/${id}`,
      dto
    );
    return data;
  },

  async revoke(id: string, reason: string) {
    const { data } = await apiClient.post<Entitlement>(
      `/entitlements/${id}/revoke`,
      { reason }
    );
    return data;
  },

  async checkEntitlement(customerId: string, entitlementKey: string) {
    const { data } = await apiClient.get<boolean>(
      `/entitlements/check/${customerId}/${entitlementKey}`
    );
    return data;
  },

  async getActiveEntitlements(customerId: string) {
    const { data } = await apiClient.get<Entitlement[]>(
      `/entitlements/customer/${customerId}/active`
    );
    return data;
  },
};
