import { CouponType, CouponStatus } from '@prisma/client';
import { z } from 'zod';

export const createCouponSchema = z
  .object({
    organizationId: z.string().uuid(),
    code: z
      .string()
      .min(3)
      .max(32)
      .regex(
        /^[A-Z0-9_-]+$/i,
        'Le code ne peut contenir que des lettres, chiffres, tirets et underscores',
      )
      .transform((v) => v.toUpperCase()),
    type: z.nativeEnum(CouponType),
    discountValue: z.number().int().positive(),
    currency: z.string().length(3).optional(),
    maxUses: z.number().int().positive().optional(),
    expiresAt: z
      .string()
      .datetime()
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),
    planIds: z.array(z.string().uuid()).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.type === CouponType.PERCENTAGE) {
        return data.discountValue <= 100;
      }
      return true;
    },
    { message: 'Le pourcentage ne peut pas dépasser 100%', path: ['discountValue'] },
  )
  .refine(
    (data) => {
      if (data.type === CouponType.FIXED_AMOUNT) {
        return !!data.currency;
      }
      return true;
    },
    { message: 'La devise est requise pour une réduction fixe', path: ['currency'] },
  );

export type CreateCouponDto = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(32)
    .regex(
      /^[A-Z0-9_-]+$/i,
      'Le code ne peut contenir que des lettres, chiffres, tirets et underscores',
    )
    .transform((v) => v.toUpperCase())
    .optional(),
  discountValue: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
  status: z.nativeEnum(CouponStatus).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .transform((v) => (v ? new Date(v) : v)),
  planIds: z.array(z.string().uuid()).optional(),
});

export type UpdateCouponDto = z.infer<typeof updateCouponSchema>;

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  planId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export type ValidateCouponDto = z.infer<typeof validateCouponSchema>;
