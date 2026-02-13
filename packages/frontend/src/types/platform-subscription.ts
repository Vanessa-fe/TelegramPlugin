export type PlatformSubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'INCOMPLETE'
  | 'EXPIRED';

export interface PlatformPlan {
  id: string;
  name: string;
  displayName: string;
  priceCents: number;
  currency: string;
  interval: string;
  trialPeriodDays: number | null;
  features: Record<string, unknown> | null;
  isActive: boolean;
  sortOrder: number;
}

export interface PlatformSubscription {
  id: string;
  organizationId: string;
  status: PlatformSubscriptionStatus;
  plan: PlatformPlan | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  canceledAt: string | null;
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
  isGrandfathered: boolean;
  createdAt: string;
}

export type PlatformPlanName = 'starter' | 'growth' | 'pro';
