import { z } from 'zod';

export const createCheckoutSchema = z.object({
  planId: z.string().uuid(),
  quantity: z.number().int().positive().max(10).optional(),
  customer: z.object({
    telegramUsername: z.string().min(1, "Nom d'utilisateur Telegram requis"),
    telegramUserId: z.string().optional(),
    displayName: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
  }),
  couponCode: z.string().max(32).optional(),
  affiliateCode: z.string().max(32).optional(),
  affiliateClickId: z.string().uuid().optional(),
});

export type CreateCheckoutDto = z.infer<typeof createCheckoutSchema>;
