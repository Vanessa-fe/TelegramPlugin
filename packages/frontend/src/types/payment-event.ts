export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
}

export enum PaymentEventType {
  CHECKOUT_COMPLETED = 'CHECKOUT_COMPLETED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_CANCELED = 'SUBSCRIPTION_CANCELED',
  INVOICE_PAID = 'INVOICE_PAID',
  INVOICE_PAYMENT_FAILED = 'INVOICE_PAYMENT_FAILED',
  REFUND_CREATED = 'REFUND_CREATED',
}

export interface PaymentEvent {
  id: string;
  organizationId: string;
  subscriptionId?: string | null;
  provider: PaymentProvider;
  type: PaymentEventType;
  externalId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  processedAt?: string | null;
  createdAt: string;
}

export interface CreatePaymentEventDto {
  organizationId: string;
  subscriptionId?: string;
  provider: PaymentProvider;
  type: PaymentEventType;
  externalId: string;
  payload: Record<string, unknown>;
  occurredAt?: string;
}
