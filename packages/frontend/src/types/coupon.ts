export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
}

export interface Coupon {
  id: string;
  organizationId: string;
  code: string;
  type: CouponType;
  discountValue: number;
  currency?: string | null;
  status: CouponStatus;
  maxUses?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  planIds: string[];
  createdAt: string;
  updatedAt: string;
  _count?: { usages: number };
}

export interface CouponUsage {
  id: string;
  couponId: string;
  subscriptionId: string;
  customerId: string;
  discountCents: number;
  originalCents: number;
  createdAt: string;
  subscription?: {
    id: string;
    plan?: { name: string };
  };
}

export interface CreateCouponDto {
  organizationId: string;
  code: string;
  type: CouponType;
  discountValue: number;
  currency?: string;
  maxUses?: number;
  expiresAt?: string;
  planIds?: string[];
}

export interface UpdateCouponDto {
  code?: string;
  discountValue?: number;
  currency?: string;
  status?: CouponStatus;
  maxUses?: number | null;
  expiresAt?: string | null;
  planIds?: string[];
}

export interface ValidateCouponDto {
  code: string;
  planId: string;
  organizationId: string;
}

export interface ValidateCouponResult {
  valid: boolean;
  coupon?: Coupon;
  discountCents?: number;
  discountPercentage?: number;
  error?: string;
}
