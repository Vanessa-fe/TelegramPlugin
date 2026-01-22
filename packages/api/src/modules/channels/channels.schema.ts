import { ChannelProvider } from '@prisma/client';
import { z } from 'zod';

const metadataSchema = z.record(z.any()).optional();

export const createChannelSchema = z.object({
  organizationId: z.string().uuid(),
  provider: z.nativeEnum(ChannelProvider),
  externalId: z.string().min(1),
  title: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  inviteLink: z.string().url().optional(),
  isActive: z.boolean().optional(),
  metadata: metadataSchema,
});

export type CreateChannelDto = z.infer<typeof createChannelSchema>;

export const updateChannelSchema = createChannelSchema
  .omit({ organizationId: true, provider: true, externalId: true })
  .partial()
  .extend({
    organizationId: z.string().uuid().optional(),
    provider: z.nativeEnum(ChannelProvider).optional(),
    externalId: z.string().min(1).optional(),
  });

export type UpdateChannelDto = z.infer<typeof updateChannelSchema>;
