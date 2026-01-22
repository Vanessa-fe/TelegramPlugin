"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChannelSchema = exports.createChannelSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const metadataSchema = zod_1.z.record(zod_1.z.any()).optional();
exports.createChannelSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid(),
    provider: zod_1.z.nativeEnum(client_1.ChannelProvider),
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
    externalId: zod_1.z.string().min(1).optional(),
});
//# sourceMappingURL=channels.schema.js.map