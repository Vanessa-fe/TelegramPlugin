import { CouponType, CouponStatus } from '@prisma/client';
import { z } from 'zod';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseCouponExpiry(value: string): Date {
  if (DATE_ONLY_REGEX.test(value)) {
    // Date picker values are date-only. Keep them valid through the selected day.
    return new Date(`${value}T23:59:59.999Z`);
  }
  return new Date(value);
}

const couponExpirySchema = z
  .string()
  .refine((value) => !Number.isNaN(parseCouponExpiry(value).getTime()), {
    message: "Date d'expiration invalide",
  })
  .transform((value) => parseCouponExpiry(value));

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
    currency: z
      .string()
      .length(3)
      .regex(/^[A-Za-z]{3}$/, 'Le code devise doit être au format ISO 4217')
      .transform((value) => value.toUpperCase())
      .optional(),
    maxUses: z.number().int().positive().optional(),
    expiresAt: z.preprocess(
      (value) => (value === '' ? undefined : value),
      couponExpirySchema.optional(),
    ),
    planIds: z.array(z.string().uuid()).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.type === CouponType.PERCENTAGE) {
        return data.discountValue <= 100;
      }
      return true;
    },
    {
      message: 'Le pourcentage ne peut pas dépasser 100%',
      path: ['discountValue'],
    },
  )
  .refine(
    (data) => {
      if (data.type === CouponType.FIXED_AMOUNT) {
        return !!data.currency;
      }
      return true;
    },
    {
      message: 'La devise est requise pour une réduction fixe',
      path: ['currency'],
    },
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
  currency: z
    .string()
    .length(3)
    .regex(/^[A-Za-z]{3}$/, 'Le code devise doit être au format ISO 4217')
    .transform((value) => value.toUpperCase())
    .optional(),
  status: z.nativeEnum(CouponStatus).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.preprocess(
    (value) => (value === '' ? null : value),
    z.union([couponExpirySchema, z.null()]).optional(),
  ),
  planIds: z.array(z.string().uuid()).optional(),
});

export type UpdateCouponDto = z.infer<typeof updateCouponSchema>;

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  planId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export type ValidateCouponDto = z.infer<typeof validateCouponSchema>;
