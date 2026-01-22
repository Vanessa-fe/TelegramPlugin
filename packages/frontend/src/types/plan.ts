export enum PlanInterval {
  ONE_TIME = 'ONE_TIME',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
}

export interface Plan {
  id: string;
  productId: string;
  name: string;
  description?: string | null;
  interval: PlanInterval;
  priceCents: number;
  currency: string;
  trialPeriodDays?: number | null;
  accessDurationDays?: number | null;
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanDto {
  productId: string;
  name: string;
  description?: string;
  interval: PlanInterval;
  priceCents: number;
  currency: string;
  trialPeriodDays?: number;
  accessDurationDays?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdatePlanDto {
  productId?: string;
  name?: string;
  description?: string;
  interval?: PlanInterval;
  priceCents?: number;
  currency?: string;
  trialPeriodDays?: number;
  accessDurationDays?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}
