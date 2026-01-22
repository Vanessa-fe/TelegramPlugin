"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEntitlementSchema = exports.createEntitlementSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createEntitlementSchema = zod_1.z.object({
    subscriptionId: zod_1.z.string().uuid(),
    customerId: zod_1.z.string().uuid(),
    entitlementKey: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(client_1.EntitlementType),
    resourceId: zod_1.z.string().optional(),
    expiresAt: zod_1.z.string().datetime().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.updateEntitlementSchema = zod_1.z.object({
    expiresAt: zod_1.z.string().datetime().optional(),
    revokedAt: zod_1.z.string().datetime().optional(),
    revokeReason: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
//# sourceMappingURL=entitlements.schema.js.map