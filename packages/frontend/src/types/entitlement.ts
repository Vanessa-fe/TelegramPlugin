export enum EntitlementType {
  CHANNEL_ACCESS = 'CHANNEL_ACCESS',
  FEATURE_FLAG = 'FEATURE_FLAG',
  CONTENT_UNLOCK = 'CONTENT_UNLOCK',
  API_QUOTA = 'API_QUOTA',
}

export interface Entitlement {
  id: string;
  subscriptionId: string;
  customerId: string;
  entitlementKey: string;
  type: EntitlementType;
  resourceId?: string;
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revokeReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntitlementDto {
  subscriptionId: string;
  customerId: string;
  entitlementKey: string;
  type: EntitlementType;
  resourceId?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateEntitlementDto {
  expiresAt?: string;
  revokedAt?: string;
  revokeReason?: string;
  metadata?: Record<string, unknown>;
}

// Entitlement with related data (returned by API)
export interface EntitlementWithRelations extends Entitlement {
  customer: {
    id: string;
    displayName?: string | null;
    email?: string | null;
    telegramUsername?: string | null;
  };
  subscription: {
    id: string;
    status: string;
    planId: string;
    plan?: {
      id: string;
      name: string;
      priceCents: number;
      currency: string;
      interval: string;
    };
  };
  channel?: {
    id: string;
    title: string | null;
    username: string | null;
  } | null;
}
