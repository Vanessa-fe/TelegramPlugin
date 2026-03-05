import apiClient from '../api-client';
import type {
  GiftCode,
  GiftCodeUsage,
  CreateGiftCodeDto,
  UpdateGiftCodeDto,
  ValidateGiftCodeDto,
  ValidateGiftCodeResult,
} from '@/types/gift-code';

export const giftCodesApi = {
  async findAll() {
    const { data } = await apiClient.get<GiftCode[]>('/admin/gift-codes');
    return data;
  },

  async findOne(id: string) {
    const { data } = await apiClient.get<GiftCode>(`/admin/gift-codes/${id}`);
    return data;
  },

  async getUsages(id: string) {
    const { data } = await apiClient.get<GiftCodeUsage[]>(`/admin/gift-codes/${id}/usages`);
    return data;
  },

  async create(dto: CreateGiftCodeDto) {
    const { data } = await apiClient.post<GiftCode>('/admin/gift-codes', dto);
    return data;
  },

  async update(id: string, dto: UpdateGiftCodeDto) {
    const { data } = await apiClient.patch<GiftCode>(`/admin/gift-codes/${id}`, dto);
    return data;
  },

  async disable(id: string) {
    const { data } = await apiClient.delete<GiftCode>(`/admin/gift-codes/${id}`);
    return data;
  },

  async validate(dto: ValidateGiftCodeDto) {
    const { data } = await apiClient.post<ValidateGiftCodeResult>(
      '/admin/gift-codes/validate',
      dto,
    );
    return data;
  },
};
