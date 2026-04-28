import apiClient from '../api-client';
import type {
  AffiliateProgram,
  AffiliateStats,
  CreateAffiliateProgramDto,
  UpdateAffiliateProgramDto,
} from '@/types/affiliate';

export const affiliateProgramApi = {
  async findOne(organizationId?: string) {
    const { data } = await apiClient.get<AffiliateProgram | null>(
      '/affiliate-program',
      {
        params: organizationId ? { organizationId } : undefined,
      },
    );
    return data;
  },

  async getStats(organizationId?: string) {
    const { data } = await apiClient.get<AffiliateStats>(
      '/affiliate-program/stats',
      {
        params: organizationId ? { organizationId } : undefined,
      },
    );
    return data;
  },

  async create(dto: CreateAffiliateProgramDto) {
    const { data } = await apiClient.post<AffiliateProgram>(
      '/affiliate-program',
      dto,
    );
    return data;
  },

  async update(dto: UpdateAffiliateProgramDto, organizationId?: string) {
    const { data } = await apiClient.patch<AffiliateProgram>(
      '/affiliate-program',
      dto,
      {
        params: organizationId ? { organizationId } : undefined,
      },
    );
    return data;
  },
};
