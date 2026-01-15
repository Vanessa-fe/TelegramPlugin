import apiClient from '../api-client';
import type { Product, CreateProductDto, UpdateProductDto } from '@/types/product';

export const productsApi = {
  async findAll(organizationId?: string) {
    const { data } = await apiClient.get<Product[]>('/products', {
      params: organizationId ? { organizationId } : undefined,
    });
    return data;
  },

  async findOne(id: string) {
    const { data } = await apiClient.get<Product>(`/products/${id}`);
    return data;
  },

  async create(dto: CreateProductDto) {
    const { data } = await apiClient.post<Product>('/products', dto);
    return data;
  },

  async update(id: string, dto: UpdateProductDto) {
    const { data } = await apiClient.patch<Product>(`/products/${id}`, dto);
    return data;
  },
};
