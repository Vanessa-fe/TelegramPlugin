import { SubscriptionStatus } from '@prisma/client';
import { z } from 'zod';

const optionalDate = z.coerce.date().optional();

export const createSubscriptionSchema = z.object({
  organizationId: z.string().uuid(),
  customerId: z.string().uuid(),
  planId: z.string().uuid(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  externalId: z.string().min(1).optional(),
  externalCustomerId: z.string().optional(),
  externalPriceId: z.string().optional(),
  currentPeriodStart: optionalDate,
  currentPeriodEnd: optionalDate,
  trialEndsAt: optionalDate,
  metadata: z.record(z.any()).optional(),
});

export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = createSubscriptionSchema
  .partial()
  .extend({
    status: z.nativeEnum(SubscriptionStatus).optional(),
    canceledAt: optionalDate,
    endedAt: optionalDate,
  });

export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
