import apiClient from '../api-client';
import type {
  Organization,
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from '@/types/organization';

export const organizationsApi = {
  async findAll() {
    const { data } = await apiClient.get<Organization[]>('/organizations');
    return data;
  },

  async findOne(id: string) {
    const { data } = await apiClient.get<Organization>(`/organizations/${id}`);
    return data;
  },

  async create(dto: CreateOrganizationDto) {
    const { data } = await apiClient.post<Organization>('/organizations', dto);
    return data;
  },

  async update(id: string, dto: UpdateOrganizationDto) {
    const { data } = await apiClient.patch<Organization>(
      `/organizations/${id}`,
      dto
    );
    return data;
  },
};
