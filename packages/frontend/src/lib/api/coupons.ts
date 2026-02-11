import apiClient from '../api-client';
import type {
  Coupon,
  CouponUsage,
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
  ValidateCouponResult,
} from '@/types/coupon';

export const couponsApi = {
  async findAll(organizationId?: string) {
    const { data } = await apiClient.get<Coupon[]>('/coupons', {
      params: organizationId ? { organizationId } : undefined,
    });
    return data;
  },

  async findOne(id: string) {
    const { data } = await apiClient.get<Coupon>(`/coupons/${id}`);
    return data;
  },

  async getUsages(id: string) {
    const { data } = await apiClient.get<CouponUsage[]>(`/coupons/${id}/usages`);
    return data;
  },

  async create(dto: CreateCouponDto) {
    const { data } = await apiClient.post<Coupon>('/coupons', dto);
    return data;
  },

  async update(id: string, dto: UpdateCouponDto) {
    const { data } = await apiClient.patch<Coupon>(`/coupons/${id}`, dto);
    return data;
  },

  async disable(id: string) {
    const { data } = await apiClient.delete<Coupon>(`/coupons/${id}`);
    return data;
  },

  async validate(dto: ValidateCouponDto) {
    const { data } = await apiClient.post<ValidateCouponResult>(
      '/coupons/validate',
      dto,
    );
    return data;
  },
};
