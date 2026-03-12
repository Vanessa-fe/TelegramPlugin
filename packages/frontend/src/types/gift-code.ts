export enum GiftCodeStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  EXPIRED = 'EXPIRED',
}

export interface GiftCode {
  id: string;
  code: string;
  description?: string | null;
  status: GiftCodeStatus;
  maxUses?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  planIds: string[];
  organizationIds: string[];
  // Platform trial options
  isPlatformTrial: boolean;
  platformPlanName?: string | null;
  trialDays?: number | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: { usages: number };
}

export interface GiftCodeUsage {
  id: string;
  giftCodeId: string;
  subscriptionId: string;
  customerId: string;
  customerEmail?: string | null;
  planId: string;
  organizationId: string;
  createdAt: string;
}

export interface CreateGiftCodeDto {
  code: string;
  description?: string;
  maxUses?: number;
  expiresAt?: string;
  planIds?: string[];
  organizationIds?: string[];
  // Platform trial options
  isPlatformTrial?: boolean;
  platformPlanName?: 'starter' | 'growth' | 'pro';
  trialDays?: number;
}

export interface UpdateGiftCodeDto {
  code?: string;
  description?: string | null;
  status?: GiftCodeStatus;
  maxUses?: number | null;
  expiresAt?: string | null;
  planIds?: string[];
  organizationIds?: string[];
  // Platform trial options
  isPlatformTrial?: boolean;
  platformPlanName?: 'starter' | 'growth' | 'pro' | null;
  trialDays?: number | null;
}

export interface ValidateGiftCodeDto {
  code: string;
  planId: string;
  organizationId: string;
}

export interface ValidateGiftCodeResult {
  valid: boolean;
  giftCode?: GiftCode;
  isFreeAccess: true;
  error?: string;
}
