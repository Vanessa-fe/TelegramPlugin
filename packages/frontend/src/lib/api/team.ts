import axios from 'axios';
import apiClient from '../api-client';
import type {
  AcceptTeamInviteDto,
  CreatedTeamInvite,
  CreateTeamInviteDto,
  TeamActionSuccess,
  TeamInvite,
  TeamMember,
  TeamPublicInvite,
  UpdateTeamMemberRoleDto,
} from '@/types/team';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

const publicClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const teamApi = {
  async listMembers(organizationId?: string) {
    const { data } = await apiClient.get<TeamMember[]>('/team/members', {
      params: organizationId ? { organizationId } : undefined,
    });
    return data;
  },

  async listInvites(organizationId?: string) {
    const { data } = await apiClient.get<TeamInvite[]>('/team/invites', {
      params: organizationId ? { organizationId } : undefined,
    });
    return data;
  },

  async createInvite(dto: CreateTeamInviteDto) {
    const { data } = await apiClient.post<CreatedTeamInvite>(
      '/team/invites',
      dto,
    );
    return data;
  },

  async revokeInvite(id: string, organizationId?: string) {
    const { data } = await apiClient.delete<TeamActionSuccess>(
      `/team/invites/${id}`,
      {
        params: organizationId ? { organizationId } : undefined,
      },
    );
    return data;
  },

  async removeMember(id: string, organizationId?: string) {
    const { data } = await apiClient.delete<TeamActionSuccess>(
      `/team/members/${id}`,
      {
        params: organizationId ? { organizationId } : undefined,
      },
    );
    return data;
  },

  async updateMemberRole(
    id: string,
    dto: UpdateTeamMemberRoleDto,
    organizationId?: string,
  ) {
    const { data } = await apiClient.patch<TeamMember>(`/team/members/${id}/role`, dto, {
      params: organizationId ? { organizationId } : undefined,
    });
    return data;
  },

  async deactivateMember(id: string, organizationId?: string) {
    const { data } = await apiClient.patch<TeamMember>(
      `/team/members/${id}/deactivate`,
      {},
      {
        params: organizationId ? { organizationId } : undefined,
      },
    );
    return data;
  },

  async reactivateMember(id: string, organizationId?: string) {
    const { data } = await apiClient.patch<TeamMember>(
      `/team/members/${id}/reactivate`,
      {},
      {
        params: organizationId ? { organizationId } : undefined,
      },
    );
    return data;
  },

  async getPublicInvite(token: string) {
    const { data } = await publicClient.get<TeamPublicInvite>(
      `/team/invites/public/${encodeURIComponent(token)}`,
    );
    return data;
  },

  async acceptInvite(dto: AcceptTeamInviteDto) {
    const { data } = await publicClient.post<{
      success: boolean;
      organizationName: string;
      email: string;
    }>('/team/invites/accept', dto);
    return data;
  },
};
