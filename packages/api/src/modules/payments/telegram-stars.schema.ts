import { z } from 'zod';

const telegramUserIdSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => value.length > 0, {
    message: 'telegramUserId requis',
  });

export const createTelegramStarsInvoiceSchema = z.object({
  planId: z.string().uuid(),
  customer: z.object({
    telegramUserId: telegramUserIdSchema,
    telegramUsername: z.string().optional(),
    displayName: z.string().optional(),
  }),
});

export type CreateTelegramStarsInvoiceDto = z.infer<
  typeof createTelegramStarsInvoiceSchema
>;

export const telegramStarsWebhookSchema = z.object({
  telegramPaymentChargeId: z.string().min(1),
  telegramUserId: telegramUserIdSchema,
  totalAmount: z.coerce.number().int().positive(),
  invoicePayload: z.string().min(1),
  providerPaymentChargeId: z.string().optional(),
});

export type TelegramStarsWebhookDto = z.infer<
  typeof telegramStarsWebhookSchema
>;

export const validatePreCheckoutSchema = z.object({
  invoicePayload: z.string().min(1),
});

export type ValidatePreCheckoutDto = z.infer<typeof validatePreCheckoutSchema>;
