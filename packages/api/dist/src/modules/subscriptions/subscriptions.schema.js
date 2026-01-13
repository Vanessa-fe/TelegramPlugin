"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSubscriptionSchema = exports.createSubscriptionSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const optionalDate = zod_1.z.coerce.date().optional();
exports.createSubscriptionSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid(),
    customerId: zod_1.z.string().uuid(),
    planId: zod_1.z.string().uuid(),
    status: zod_1.z.nativeEnum(client_1.SubscriptionStatus).optional(),
    externalId: zod_1.z.string().min(1).optional(),
    externalCustomerId: zod_1.z.string().optional(),
    externalPriceId: zod_1.z.string().optional(),
    currentPeriodStart: optionalDate,
    currentPeriodEnd: optionalDate,
    trialEndsAt: optionalDate,
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.updateSubscriptionSchema = exports.createSubscriptionSchema
    .partial()
    .extend({
    status: zod_1.z.nativeEnum(client_1.SubscriptionStatus).optional(),
    canceledAt: optionalDate,
    endedAt: optionalDate,
});
//# sourceMappingURL=subscriptions.schema.js.map