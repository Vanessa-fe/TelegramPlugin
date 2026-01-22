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
