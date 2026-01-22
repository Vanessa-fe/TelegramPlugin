import apiClient from '../api-client';
import type { Plan, CreatePlanDto, UpdatePlanDto } from '@/types/plan';

export const plansApi = {
  async findAll(params?: { productId?: string; organizationId?: string }) {
    const { data } = await apiClient.get<Plan[]>('/plans', { params });
    return data;
  },

  async findOne(id: string) {
    const { data } = await apiClient.get<Plan>(`/plans/${id}`);
    return data;
  },

  async create(dto: CreatePlanDto) {
    const { data } = await apiClient.post<Plan>('/plans', dto);
    return data;
  },

  async update(id: string, dto: UpdatePlanDto) {
    const { data } = await apiClient.patch<Plan>(`/plans/${id}`, dto);
    return data;
  },
};
