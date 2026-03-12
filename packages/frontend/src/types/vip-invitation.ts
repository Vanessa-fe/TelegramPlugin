export enum VipInvitationStatus {
  PENDING = 'PENDING',
  ACTIVATED = 'ACTIVATED',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export type StripeStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'INCOMPLETE'
  | 'EXPIRED'
  | 'NONE';

export interface VipInvitation {
  id: string;
  email: string;
  token: string;
  status: VipInvitationStatus;
  platformPlanName: string;
  trialDays: number;
  emailSentAt?: string | null;
  activatedAt?: string | null;
  convertedAt?: string | null;
  expiresAt?: string | null;
  organizationId?: string | null;
  offersCreated: number;
  salesGenerated: number;
  createdById: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  // Enriched data from organization
  organizationName?: string | null;
  stripeStatus?: StripeStatus;
  channelsCount?: number;
}

export interface CreateVipInvitationDto {
  email: string;
  platformPlanName: 'starter' | 'growth' | 'pro';
  trialDays: number;
  notes?: string;
}

export interface ExtendVipTrialDto {
  additionalDays: number;
}

export interface VipInvitationStats {
  pending: number;
  activated: number;
  converted: number;
  expired: number;
  conversionRate: number;
}

export interface VipInvitationsListResponse {
  invitations: VipInvitation[];
  total: number;
}
