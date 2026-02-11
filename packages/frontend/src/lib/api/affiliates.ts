import apiClient from '../api-client';
import type {
  Affiliate,
  AffiliateReferral,
  AffiliatePayout,
  CreateAffiliateDto,
  UpdateAffiliateDto,
  CreatePayoutDto,
  UpdatePayoutDto,
  ValidateAffiliateDto,
  ValidateAffiliateResult,
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
};
