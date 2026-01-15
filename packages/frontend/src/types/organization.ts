export interface Organization {
  id: string;
  name: string;
  slug: string;
  billingEmail: string;
  stripeAccountId?: string | null;
  saasActive?: boolean;
  timezone?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  billingEmail: string;
  saasActive?: boolean;
  timezone?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateOrganizationDto {
  name?: string;
  slug?: string;
  billingEmail?: string;
  saasActive?: boolean;
  timezone?: string;
  metadata?: Record<string, unknown>;
}
