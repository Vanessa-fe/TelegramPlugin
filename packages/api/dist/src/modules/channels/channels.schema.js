"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChannelSchema = exports.createChannelSchema = exports.confirmVerificationSchema = exports.setDiscordRoleSchema = exports.verifyDiscordChannelSchema = exports.verifyChannelSchema = exports.startVerificationSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const metadataSchema = zod_1.z.record(zod_1.z.any()).optional();
exports.startVerificationSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(client_1.ChannelType),
    provider: zod_1.z.nativeEnum(client_1.ChannelProvider).optional().default(client_1.ChannelProvider.TELEGRAM),
});
exports.verifyChannelSchema = zod_1.z.object({
    code: zod_1.z.string().regex(/^TGPLUGIN-[A-Z0-9]{8}$/i, 'Invalid verification code'),
    telegramChatId: zod_1.z.string().min(1),
    telegramTitle: zod_1.z.string(),
    telegramUsername: zod_1.z.string().nullable(),
    chatType: zod_1.z.enum(['CHANNEL', 'GROUP']),
});
exports.verifyDiscordChannelSchema = zod_1.z.object({
    code: zod_1.z.string().regex(/^DISCORD-[A-Z0-9]{8}$/i, 'Invalid Discord verification code'),
    discordGuildId: zod_1.z.string().min(1),
    discordGuildName: zod_1.z.string(),
    roles: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        color: zod_1.z.string().optional(),
        position: zod_1.z.number().optional(),
    })).optional(),
});
exports.setDiscordRoleSchema = zod_1.z.object({
    roleId: zod_1.z.string().min(1),
    roleName: zod_1.z.string().optional(),
});
exports.confirmVerificationSchema = zod_1.z.object({
    verificationId: zod_1.z.string().uuid(),
});
exports.createChannelSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid(),
    provider: zod_1.z.nativeEnum(client_1.ChannelProvider),
    type: zod_1.z.nativeEnum(client_1.ChannelType).optional(),
    externalId: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1).optional(),
    username: zod_1.z.string().min(1).optional(),
    inviteLink: zod_1.z.string().url().optional(),
    isActive: zod_1.z.boolean().optional(),
    metadata: metadataSchema,
});
exports.updateChannelSchema = exports.createChannelSchema
    .omit({ organizationId: true, provider: true, externalId: true })
    .partial()
    .extend({
    organizationId: zod_1.z.string().uuid().optional(),
    provider: zod_1.z.nativeEnum(client_1.ChannelProvider).optional(),
    type: zod_1.z.nativeEnum(client_1.ChannelType).optional(),
    externalId: zod_1.z.string().min(1).optional(),
});
//# sourceMappingURL=channels.schema.js.map