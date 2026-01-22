import { z } from 'zod';
import { EntitlementType } from '@prisma/client';

export const createEntitlementSchema = z.object({
  subscriptionId: z.string().uuid(),
  customerId: z.string().uuid(),
  entitlementKey: z.string().min(1),
  type: z.nativeEnum(EntitlementType),
  resourceId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateEntitlementSchema = z.object({
  expiresAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional(),
  revokeReason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateEntitlementDto = z.infer<typeof createEntitlementSchema>;
export type UpdateEntitlementDto = z.infer<typeof updateEntitlementSchema>;
