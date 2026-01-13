import { PaymentEventType, PaymentProvider } from '@prisma/client';
import { z } from 'zod';

export const createPaymentEventSchema = z.object({
  organizationId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  provider: z.nativeEnum(PaymentProvider),
  type: z.nativeEnum(PaymentEventType),
  externalId: z.string().min(1),
  payload: z.record(z.any()),
  occurredAt: z.coerce.date().optional(),
});

export type CreatePaymentEventDto = z.infer<typeof createPaymentEventSchema>;
