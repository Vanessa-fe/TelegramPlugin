import { PlanInterval } from '@prisma/client';
import { z } from 'zod';

const metadataSchema = z.record(z.any()).optional();

export const createPlanSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  interval: z.nativeEnum(PlanInterval),
  priceCents: z.number().int().positive(),
  currency: z
    .string()
    .length(3)
    .regex(/^[A-Za-z]{3}$/, 'Le code devise doit être au format ISO 4217')
    .transform((value) => value.toUpperCase()),
  trialPeriodDays: z.number().int().nonnegative().optional(),
  accessDurationDays: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  metadata: metadataSchema,
});

export type CreatePlanDto = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema
  .omit({ productId: true })
  .partial()
  .extend({
    productId: z.string().uuid().optional(),
  });

export type UpdatePlanDto = z.infer<typeof updatePlanSchema>;
