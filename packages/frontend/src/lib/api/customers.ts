import apiClient from '../api-client';
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer';

export const customersApi = {
  async findAll(organizationId?: string) {
    const { data } = await apiClient.get<Customer[]>('/customers', {
      params: organizationId ? { organizationId } : undefined,
    });
    return data;
  },

  async findOne(id: string) {
    const { data } = await apiClient.get<Customer>(`/customers/${id}`);
    return data;
  },

  async create(dto: CreateCustomerDto) {
    const { data } = await apiClient.post<Customer>('/customers', dto);
    return data;
  },

  async update(id: string, dto: UpdateCustomerDto) {
    const { data } = await apiClient.patch<Customer>(`/customers/${id}`, dto);
    return data;
  },
};
