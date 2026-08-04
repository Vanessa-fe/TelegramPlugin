export interface Organization {
  id: string;
  name: string;
  slug: string;
  billingEmail: string;
  currency: string;
  stripeAccountId?: string | null;
  saasActive?: boolean;
  platformPlan?: string | null;
  platformStatus?:
    | 'TRIALING'
    | 'ACTIVE'
    | 'PAST_DUE'
    | 'CANCELED'
    | 'INCOMPLETE'
    | 'EXPIRED'
    | null;
  suspendedAt?: string | null;
  suspendReason?: string | null;
  timezone?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  billingEmail: string;
  currency?: string;
  saasActive?: boolean;
  timezone?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateOrganizationDto {
  name?: string;
  slug?: string;
  billingEmail?: string;
  currency?: string;
  saasActive?: boolean;
  timezone?: string;
  metadata?: Record<string, unknown>;
}
