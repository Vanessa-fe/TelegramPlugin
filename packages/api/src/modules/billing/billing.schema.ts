import { z } from 'zod';

export const createCheckoutSchema = z.object({
  planId: z.string().uuid(),
  quantity: z.number().int().positive().max(10).optional(),
  customer: z
    .object({
      email: z.string().email().optional(),
      telegramUserId: z.string().optional(),
      telegramUsername: z.string().optional(),
      displayName: z.string().optional(),
    })
    .refine((value) => value.email || value.telegramUserId, {
      message: 'Email ou identifiant Telegram requis',
    }),
});

export type CreateCheckoutDto = z.infer<typeof createCheckoutSchema>;
