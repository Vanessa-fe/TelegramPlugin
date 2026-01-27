import { z } from 'zod';

const metadataSchema = z.record(z.any()).optional();

const customerBaseSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email().optional(),
  displayName: z.string().min(1).optional(),
  telegramUserId: z.string().min(1).optional(),
  telegramUsername: z
    .string()
    .regex(/^[A-Za-z0-9_]{5,32}$/, {
      message:
        'Le nom d’utilisateur Telegram doit contenir 5 à 32 caractères alphanumériques ou underscores',
    })
    .optional(),
  externalId: z.string().min(1).optional(),
  metadata: metadataSchema,
});

export const createCustomerSchema = customerBaseSchema.superRefine(
  (value, ctx) => {
    if (
      !(
        value.email ||
        value.displayName ||
        value.telegramUserId ||
        value.telegramUsername
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Un client doit contenir au moins un moyen d’identification (email, displayName ou identifiants Telegram)',
        path: ['email'],
      });
    }
  },
);

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = customerBaseSchema.partial();

export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
