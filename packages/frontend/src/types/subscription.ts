export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  INCOMPLETE = 'INCOMPLETE',
  TRIALING = 'TRIALING',
  EXPIRED = 'EXPIRED',
}

export interface Subscription {
  id: string;
  organizationId: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  externalId?: string | null;
  externalCustomerId?: string | null;
  externalPriceId?: string | null;
  startedAt: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialEndsAt?: string | null;
  canceledAt?: string | null;
  endedAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionDto {
  organizationId: string;
  customerId: string;
  planId: string;
  status?: SubscriptionStatus;
  externalId?: string;
  externalCustomerId?: string;
  externalPriceId?: string;
  startedAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEndsAt?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSubscriptionDto {
  organizationId?: string;
  customerId?: string;
  planId?: string;
  status?: SubscriptionStatus;
  externalId?: string;
  externalCustomerId?: string;
  externalPriceId?: string;
  startedAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEndsAt?: string;
  canceledAt?: string;
  endedAt?: string;
  metadata?: Record<string, unknown>;
}
