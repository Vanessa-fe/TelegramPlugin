import apiClient from '../api-client';
import type { Channel, ChannelAccess, CreateChannelDto, UpdateChannelDto } from '@/types/channel';

export const channelsApi = {
  async findAll(organizationId?: string) {
    const { data } = await apiClient.get<Channel[]>('/channels', {
      params: organizationId ? { organizationId } : undefined,
    });
    return data;
  },

  async findOne(id: string) {
    const { data } = await apiClient.get<Channel>(`/channels/${id}`);
    return data;
  },

  async create(dto: CreateChannelDto) {
    const { data } = await apiClient.post<Channel>('/channels', dto);
    return data;
  },

  async update(id: string, dto: UpdateChannelDto) {
    const { data } = await apiClient.patch<Channel>(`/channels/${id}`, dto);
    return data;
  },

  async getAccesses(channelId: string) {
    const { data } = await apiClient.get<ChannelAccess[]>(`/channels/${channelId}/accesses`);
    return data;
  },

  async grantAccess(payload: { subscriptionId: string; channelId: string; customerId: string }) {
    const { data } = await apiClient.post('/access/grant', payload);
    return data;
  },

  async revokeAccess(payload: { subscriptionId: string; reason: string }) {
    const { data } = await apiClient.post('/access/revoke', payload);
    return data;
  },
};
