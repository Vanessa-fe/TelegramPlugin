import { z } from 'zod';

export const createPlatformCheckoutSchema = z.object({
  planName: z.enum(['early-adopter', 'pro']),
});

export type CreatePlatformCheckoutDto = z.infer<
  typeof createPlatformCheckoutSchema
>;

export const platformPlanResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  displayName: z.string(),
  priceCents: z.number(),
  currency: z.string(),
  interval: z.string(),
  trialPeriodDays: z.number().nullable(),
  features: z.record(z.unknown()).nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
});

export type PlatformPlanResponse = z.infer<typeof platformPlanResponseSchema>;

export const platformSubscriptionResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  status: z.enum([
    'TRIALING',
    'ACTIVE',
    'PAST_DUE',
    'CANCELED',
    'INCOMPLETE',
    'EXPIRED',
  ]),
  plan: platformPlanResponseSchema.nullable(),
  stripeSubscriptionId: z.string().nullable(),
  currentPeriodStart: z.date().nullable(),
  currentPeriodEnd: z.date().nullable(),
  trialEndsAt: z.date().nullable(),
  canceledAt: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  graceUntil: z.date().nullable(),
  isGrandfathered: z.boolean(),
  createdAt: z.date(),
});

export type PlatformSubscriptionResponse = z.infer<
  typeof platformSubscriptionResponseSchema
>;
