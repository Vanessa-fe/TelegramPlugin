import { ChannelProvider, ChannelType } from '@prisma/client';
import { z } from 'zod';

const metadataSchema = z.record(z.any()).optional();

// Schémas pour la vérification de channel
export const startVerificationSchema = z.object({
  type: z.nativeEnum(ChannelType),
  provider: z
    .nativeEnum(ChannelProvider)
    .optional()
    .default(ChannelProvider.TELEGRAM),
});

export type StartVerificationDto = z.infer<typeof startVerificationSchema>;

// Telegram verification schema
export const verifyChannelSchema = z.object({
  code: z
    .string()
    .regex(/^TGPLUGIN-[A-Z0-9]{8}$/i, 'Invalid verification code'),
  telegramChatId: z.string().min(1),
  telegramTitle: z.string(),
  telegramUsername: z.string().nullable(),
  chatType: z.enum(['CHANNEL', 'GROUP']),
});

export type VerifyChannelDto = z.infer<typeof verifyChannelSchema>;

// Discord verification schema
export const verifyDiscordChannelSchema = z.object({
  code: z
    .string()
    .regex(/^DISCORD-[A-Z0-9]{8}$/i, 'Invalid Discord verification code'),
  discordGuildId: z.string().min(1),
  discordGuildName: z.string(),
  roles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string().optional(),
        position: z.number().optional(),
      }),
    )
    .optional(),
});

export type VerifyDiscordChannelDto = z.infer<
  typeof verifyDiscordChannelSchema
>;

// Set Discord role for paid access
export const setDiscordRoleSchema = z.object({
  roleId: z.string().min(1),
  roleName: z.string().optional(),
});

export type SetDiscordRoleDto = z.infer<typeof setDiscordRoleSchema>;

export const confirmVerificationSchema = z.object({
  verificationId: z.string().uuid(),
});

export type ConfirmVerificationDto = z.infer<typeof confirmVerificationSchema>;

export const createChannelSchema = z.object({
  organizationId: z.string().uuid(),
  provider: z.nativeEnum(ChannelProvider),
  type: z.nativeEnum(ChannelType).optional(),
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
    type: z.nativeEnum(ChannelType).optional(),
    externalId: z.string().min(1).optional(),
  });

export type UpdateChannelDto = z.infer<typeof updateChannelSchema>;
