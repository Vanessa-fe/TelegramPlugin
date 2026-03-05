import { GiftCodeStatus } from '@prisma/client';
import { z } from 'zod';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseExpiry(value: string): Date {
  if (DATE_ONLY_REGEX.test(value)) {
    return new Date(`${value}T23:59:59.999Z`);
  }
  return new Date(value);
}

const expirySchema = z
  .string()
  .refine((value) => !Number.isNaN(parseExpiry(value).getTime()), {
    message: "Date d'expiration invalide",
  })
  .transform((value) => parseExpiry(value));

export const createGiftCodeSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(32)
    .regex(
      /^[A-Z0-9_-]+$/i,
      'Le code ne peut contenir que des lettres, chiffres, tirets et underscores',
    )
    .transform((v) => v.toUpperCase()),
  description: z.string().max(500).optional(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.preprocess(
    (value) => (value === '' ? undefined : value),
    expirySchema.optional(),
  ),
  planIds: z.array(z.string().uuid()).optional().default([]),
  organizationIds: z.array(z.string().uuid()).optional().default([]),
});

export type CreateGiftCodeDto = z.infer<typeof createGiftCodeSchema>;

export const updateGiftCodeSchema = z.object({
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
  description: z.string().max(500).nullable().optional(),
  status: z.nativeEnum(GiftCodeStatus).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.preprocess(
    (value) => (value === '' ? null : value),
    z.union([expirySchema, z.null()]).optional(),
  ),
  planIds: z.array(z.string().uuid()).optional(),
  organizationIds: z.array(z.string().uuid()).optional(),
});

export type UpdateGiftCodeDto = z.infer<typeof updateGiftCodeSchema>;

export const validateGiftCodeSchema = z.object({
  code: z.string().min(1),
  planId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export type ValidateGiftCodeDto = z.infer<typeof validateGiftCodeSchema>;
