import apiClient from '../api-client';
import type {
  Affiliate,
  AffiliateClick,
  AffiliateReferral,
  AffiliatePayout,
  AffiliateStats,
  CreateAffiliateDto,
  UpdateAffiliateDto,
  CreatePayoutDto,
  UpdatePayoutDto,
  ValidateAffiliateDto,
  ValidateAffiliateResult,
  TrackClickDto,
} from '@/types/affiliate';

export const affiliatesApi = {
  async findAll(organizationId?: string) {
    const { data } = await apiClient.get<Affiliate[]>('/affiliates', {
      params: organizationId ? { organizationId } : undefined,
    });
    return data;
  },

  async findOne(id: string) {
    const { data } = await apiClient.get<Affiliate>(`/affiliates/${id}`);
    return data;
  },

  async getReferrals(id: string) {
    const { data } = await apiClient.get<AffiliateReferral[]>(
      `/affiliates/${id}/referrals`,
    );
    return data;
  },

  async getPayouts(id: string) {
    const { data } = await apiClient.get<AffiliatePayout[]>(
      `/affiliates/${id}/payouts`,
    );
    return data;
  },

  async create(dto: CreateAffiliateDto) {
    const { data } = await apiClient.post<Affiliate>('/affiliates', dto);
    return data;
  },

  async update(id: string, dto: UpdateAffiliateDto) {
    const { data } = await apiClient.patch<Affiliate>(`/affiliates/${id}`, dto);
    return data;
  },

  async deactivate(id: string) {
    const { data } = await apiClient.delete<Affiliate>(`/affiliates/${id}`);
    return data;
  },

  async createPayout(affiliateId: string, dto: CreatePayoutDto) {
    const { data } = await apiClient.post<AffiliatePayout>(
      `/affiliates/${affiliateId}/payouts`,
      dto,
    );
    return data;
  },

  async updatePayout(payoutId: string, dto: UpdatePayoutDto) {
    const { data } = await apiClient.patch<AffiliatePayout>(
      `/affiliates/payouts/${payoutId}`,
      dto,
    );
    return data;
  },

  async validate(dto: ValidateAffiliateDto) {
    const { data } = await apiClient.post<ValidateAffiliateResult>(
      '/affiliates/validate',
      dto,
    );
    return data;
  },

  async trackClick(dto: TrackClickDto) {
    const { data } = await apiClient.post<AffiliateClick>(
      '/affiliates/track-click',
      dto,
    );
    return data;
  },

  async getOrganizationStats(organizationId?: string) {
    const { data } = await apiClient.get<AffiliateStats>('/affiliates/stats', {
      params: organizationId ? { organizationId } : undefined,
    });
    return data;
  },

  async getAffiliateStats(id: string) {
    const { data } = await apiClient.get<AffiliateStats>(
      `/affiliates/${id}/stats`,
    );
    return data;
  },

  async getClicks(id: string, limit?: number) {
    const { data } = await apiClient.get<AffiliateClick[]>(
      `/affiliates/${id}/clicks`,
      {
        params: limit ? { limit: String(limit) } : undefined,
      },
    );
    return data;
  },

  async approveReferral(referralId: string) {
    const { data } = await apiClient.post<AffiliateReferral>(
      `/affiliates/referrals/${referralId}/approve`,
    );
    return data;
  },

  async cancelReferral(referralId: string) {
    const { data } = await apiClient.post<AffiliateReferral>(
      `/affiliates/referrals/${referralId}/cancel`,
    );
    return data;
  },
};
