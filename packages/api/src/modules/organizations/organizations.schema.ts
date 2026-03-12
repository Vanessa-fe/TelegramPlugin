import { z } from 'zod';

const metadataSchema = z.record(z.any()).optional();
const currencySchema = z
  .string()
  .length(3)
  .regex(/^[A-Za-z]{3}$/, 'Le code devise doit être au format ISO 4217')
  .transform((value) => value.toUpperCase());

export const createOrganizationSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, {
      message:
        'Le slug doit contenir uniquement des lettres, chiffres ou tirets',
    })
    .transform((value) => value.toLowerCase()),
  billingEmail: z.string().email(),
  currency: currencySchema.optional(),
  saasActive: z.boolean().optional(),
  timezone: z.string().min(1).optional(),
  metadata: metadataSchema,
});

export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = createOrganizationSchema
  .partial()
  .extend({
    slug: createOrganizationSchema.shape.slug.optional(),
  });

export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;

export const suspendOrganizationSchema = z.object({
  reason: z.string().optional(),
});

export type SuspendOrganizationDto = z.infer<typeof suspendOrganizationSchema>;
