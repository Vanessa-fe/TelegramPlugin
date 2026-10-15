import { ProductStatus } from '@prisma/client';
import { z } from 'zod';

const metadataSchema = z.record(z.any()).optional();

export const createProductSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(2048).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  metadata: metadataSchema,
  // Channels buyers of this offer get access to; replaces the whole set
  channelIds: z.array(z.string().uuid()).max(50).optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();

export type UpdateProductDto = z.infer<typeof updateProductSchema>;
