import apiClient from '../api-client';
import type {
  VipInvitation,
  VipInvitationStats,
  VipInvitationsListResponse,
  CreateVipInvitationDto,
  ExtendVipTrialDto,
} from '@/types/vip-invitation';
import type { VipInvitationStatus } from '@/types/vip-invitation';

export const vipInvitationsApi = {
  async findAll(params?: {
    status?: VipInvitationStatus;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    const url = `/admin/vip-invitations${query ? `?${query}` : ''}`;
    const { data } = await apiClient.get<VipInvitationsListResponse>(url);
    return data;
  },

  async findOne(id: string) {
    const { data } = await apiClient.get<VipInvitation>(
      `/admin/vip-invitations/${id}`,
    );
    return data;
  },

  async create(dto: CreateVipInvitationDto) {
    const { data } = await apiClient.post<VipInvitation>(
      '/admin/vip-invitations',
      dto,
    );
    return data;
  },

  async extendTrial(id: string, dto: ExtendVipTrialDto) {
    const { data } = await apiClient.post<VipInvitation>(
      `/admin/vip-invitations/${id}/extend`,
      dto,
    );
    return data;
  },

  async cancel(id: string) {
    const { data } = await apiClient.delete<VipInvitation>(
      `/admin/vip-invitations/${id}`,
    );
    return data;
  },

  async getStats() {
    const { data } = await apiClient.get<VipInvitationStats>(
      '/admin/vip-invitations/stats',
    );
    return data;
  },
};
