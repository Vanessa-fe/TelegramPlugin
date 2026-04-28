import { AffiliateProgramStatus, CommissionAppliesTo } from '@prisma/client';
import { z } from 'zod';

export const createAffiliateProgramSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  commissionValue: z
    .number()
    .int()
    .min(1)
    .max(100, 'Le taux de commission ne peut pas dépasser 100%'),
  attributionWindowDays: z.number().int().min(1).max(90).default(30),
  validationDelayDays: z.number().int().min(0).max(60).default(14),
  appliesTo: z
    .nativeEnum(CommissionAppliesTo)
    .default(CommissionAppliesTo.ALL_PRODUCTS),
  productIds: z.array(z.string().uuid()).default([]),
  status: z
    .nativeEnum(AffiliateProgramStatus)
    .default(AffiliateProgramStatus.ACTIVE),
});

export type CreateAffiliateProgramDto = z.infer<
  typeof createAffiliateProgramSchema
>;

export const updateAffiliateProgramSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  commissionValue: z
    .number()
    .int()
    .min(1)
    .max(100, 'Le taux de commission ne peut pas dépasser 100%')
    .optional(),
  attributionWindowDays: z.number().int().min(1).max(90).optional(),
  validationDelayDays: z.number().int().min(0).max(60).optional(),
  appliesTo: z.nativeEnum(CommissionAppliesTo).optional(),
  productIds: z.array(z.string().uuid()).optional(),
  status: z.nativeEnum(AffiliateProgramStatus).optional(),
});

export type UpdateAffiliateProgramDto = z.infer<
  typeof updateAffiliateProgramSchema
>;
