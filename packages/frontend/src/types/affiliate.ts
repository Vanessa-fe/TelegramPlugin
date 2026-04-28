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

export enum ConversionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
  PAID = 'PAID',
}

export enum AffiliateProgramStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

export enum CommissionAppliesTo {
  ALL_PRODUCTS = 'ALL_PRODUCTS',
  SPECIFIC_PRODUCTS = 'SPECIFIC_PRODUCTS',
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
  totalClicks: number;
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
  clickId?: string | null;
  productId?: string | null;
  amountCents: number;
  commissionCents: number;
  currency: string;
  isPaid: boolean;
  status: ConversionStatus;
  approvedAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  subscription?: {
    id: string;
    plan?: { name: string };
    status?: string;
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

export interface AffiliateProgram {
  id: string;
  organizationId: string;
  name: string;
  commissionValue: number;
  attributionWindowDays: number;
  validationDelayDays: number;
  appliesTo: CommissionAppliesTo;
  productIds: string[];
  status: AffiliateProgramStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { affiliates: number };
  totalClicks?: number;
  totalConversions?: number;
  totalCommissions?: number;
}

export interface CreateAffiliateProgramDto {
  organizationId: string;
  name: string;
  commissionValue: number;
  attributionWindowDays?: number;
  validationDelayDays?: number;
  appliesTo?: CommissionAppliesTo;
  productIds?: string[];
  status?: AffiliateProgramStatus;
}

export interface UpdateAffiliateProgramDto {
  name?: string;
  commissionValue?: number;
  attributionWindowDays?: number;
  validationDelayDays?: number;
  appliesTo?: CommissionAppliesTo;
  productIds?: string[];
  status?: AffiliateProgramStatus;
}

export interface AffiliateClick {
  id: string;
  affiliateId: string;
  visitorId: string;
  ipHash?: string | null;
  userAgent?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
  createdAt: string;
}

export interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  pendingConversions: number;
  approvedConversions: number;
  paidConversions: number;
  cancelledConversions: number;
  totalCommissions: number;
  pendingCommissions: number;
  approvedCommissions: number;
  paidCommissions: number;
  conversionRate: number;
}

export interface TrackClickDto {
  code: string;
  organizationId: string;
  visitorId: string;
  landingPage?: string;
  referrer?: string;
  userAgent?: string;
}
