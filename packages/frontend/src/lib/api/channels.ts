import apiClient from '../api-client';
import {
  ChannelProvider,
  type Channel,
  type ChannelAccess,
  type CreateChannelDto,
  type UpdateChannelDto,
  type ChannelType,
  type ChannelVerification,
  type VerificationStatusResponse,
  type DiscordGuild,
} from '@/types/channel';

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

  // Verification methods
  async startVerification(type: ChannelType, provider: ChannelProvider = ChannelProvider.TELEGRAM) {
    const { data } = await apiClient.post<ChannelVerification>(
      '/channels/verification/start',
      { type, provider }
    );
    return data;
  },

  async checkVerificationStatus(verificationId: string) {
    const { data } = await apiClient.get<VerificationStatusResponse>(
      `/channels/verification/${verificationId}/status`
    );
    return data;
  },

  async confirmVerification(verificationId: string) {
    const { data } = await apiClient.post<Channel>(
      `/channels/verification/${verificationId}/confirm`
    );
    return data;
  },

  // Discord-specific verification methods
  async setDiscordRole(verificationId: string, roleId: string, roleName?: string) {
    const { data } = await apiClient.post<{ success: boolean }>(
      `/channels/verification/${verificationId}/discord/role`,
      { roleId, roleName }
    );
    return data;
  },

  async confirmDiscordVerification(verificationId: string) {
    const { data } = await apiClient.post<Channel>(
      `/channels/verification/${verificationId}/discord/confirm`
    );
    return data;
  },

  // Discord guild management
  async getDiscordGuild(channelId: string) {
    const { data } = await apiClient.get<DiscordGuild>(
      `/channels/${channelId}/discord`
    );
    return data;
  },

  async updateDiscordRole(channelId: string, roleId: string, roleName?: string) {
    const { data } = await apiClient.patch<DiscordGuild>(
      `/channels/${channelId}/discord/role`,
      { roleId, roleName }
    );
    return data;
  },
};
