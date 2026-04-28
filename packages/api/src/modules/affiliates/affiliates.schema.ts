import {
  AffiliateStatus,
  ConversionStatus,
  PayoutStatus,
} from '@prisma/client';
import { z } from 'zod';

export const createAffiliateSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmedValue = value.trim();
    return trimmedValue === '' ? undefined : trimmedValue;
  }, z.string().email().optional()),
  name: z.string().min(1).max(120).optional(),
  referralCode: z
    .string()
    .min(3)
    .max(32)
    .regex(
      /^[A-Z0-9_-]+$/i,
      'Le code ne peut contenir que des lettres, chiffres, tirets et underscores',
    )
    .transform((v) => v.toUpperCase())
    .optional(),
  commissionRate: z
    .number()
    .int()
    .min(1)
    .max(100, 'Le taux de commission ne peut pas dépasser 100%'),
  status: z.nativeEnum(AffiliateStatus).optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateAffiliateDto = z.infer<typeof createAffiliateSchema>;

export const updateAffiliateSchema = z.object({
  email: z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmedValue = value.trim();
    return trimmedValue === '' ? undefined : trimmedValue;
  }, z.string().email().optional()),
  name: z.string().min(1).max(120).optional(),
  referralCode: z
    .string()
    .min(3)
    .max(32)
    .regex(
      /^[A-Z0-9_-]+$/i,
      'Le code ne peut contenir que des lettres, chiffres, tirets et underscores',
    )
    .transform((v) => v.toUpperCase())
    .optional(),
  commissionRate: z
    .number()
    .int()
    .min(1)
    .max(100, 'Le taux de commission ne peut pas dépasser 100%')
    .optional(),
  status: z.nativeEnum(AffiliateStatus).optional(),
  metadata: z.record(z.any()).optional(),
});

export type UpdateAffiliateDto = z.infer<typeof updateAffiliateSchema>;

export const createPayoutSchema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default('eur'),
  method: z.string().max(64).optional(),
  notes: z.string().max(500).optional(),
});

export type CreatePayoutDto = z.infer<typeof createPayoutSchema>;

export const updatePayoutSchema = z.object({
  status: z.nativeEnum(PayoutStatus),
  notes: z.string().max(500).optional(),
});

export type UpdatePayoutDto = z.infer<typeof updatePayoutSchema>;

export const validateAffiliateSchema = z.object({
  code: z.string().min(1),
  organizationId: z.string().uuid(),
});

export type ValidateAffiliateDto = z.infer<typeof validateAffiliateSchema>;

export const trackClickSchema = z.object({
  code: z.string().min(1),
  organizationId: z.string().uuid(),
  visitorId: z.string().min(1).max(100),
  landingPage: z.string().url().optional(),
  referrer: z.string().url().optional(),
  userAgent: z.string().max(500).optional(),
});

export type TrackClickDto = z.infer<typeof trackClickSchema>;

export const updateReferralStatusSchema = z.object({
  status: z.nativeEnum(ConversionStatus),
});

export type UpdateReferralStatusDto = z.infer<
  typeof updateReferralStatusSchema
>;
