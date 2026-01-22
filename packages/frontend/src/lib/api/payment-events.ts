import apiClient from '../api-client';
import type { PaymentEvent, CreatePaymentEventDto } from '@/types/payment-event';

export const paymentEventsApi = {
  async findAll(organizationId?: string) {
    const { data } = await apiClient.get<PaymentEvent[]>('/payment-events', {
      params: organizationId ? { organizationId } : undefined,
    });
    return data;
  },

  async findOne(id: string) {
    const { data } = await apiClient.get<PaymentEvent>(`/payment-events/${id}`);
    return data;
  },

  async create(dto: CreatePaymentEventDto) {
    const { data } = await apiClient.post<PaymentEvent>('/payment-events', dto);
    return data;
  },
};
