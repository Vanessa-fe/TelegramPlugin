export enum AffiliateStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Affiliate {
  id: string;
  organizationId: string;
  email: string;
  name?: string | null;
  referralCode: string;
  commissionRate: number;
  status: AffiliateStatus;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  _count?: { referrals: number; payouts: number };
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  subscriptionId: string;
  customerId: string;
  amountCents: number;
  commissionCents: number;
  currency: string;
  isPaid: boolean;
  createdAt: string;
  subscription?: {
    id: string;
    plan?: { name: string };
  };
  customer?: {
    id: string;
    email?: string | null;
    telegramUsername?: string | null;
  };
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  amountCents: number;
  currency: string;
  status: PayoutStatus;
  method?: string | null;
  notes?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

export interface CreateAffiliateDto {
  organizationId: string;
  email?: string;
  name?: string;
  referralCode?: string;
  commissionRate: number;
  status?: AffiliateStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateAffiliateDto {
  email?: string;
  name?: string;
  referralCode?: string;
  commissionRate?: number;
  status?: AffiliateStatus;
  metadata?: Record<string, unknown>;
}

export interface CreatePayoutDto {
  amountCents: number;
  currency?: string;
  method?: string;
  notes?: string;
}

export interface UpdatePayoutDto {
  status: PayoutStatus;
  notes?: string;
}

export interface ValidateAffiliateDto {
  code: string;
  organizationId: string;
}

export interface ValidateAffiliateResult {
  valid: boolean;
  affiliate?: Affiliate;
  error?: string;
}
