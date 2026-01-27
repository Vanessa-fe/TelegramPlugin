"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformSubscriptionResponseSchema = exports.platformPlanResponseSchema = exports.createPlatformCheckoutSchema = void 0;
const zod_1 = require("zod");
exports.createPlatformCheckoutSchema = zod_1.z.object({
    planName: zod_1.z.enum(['early-adopter', 'pro']),
});
exports.platformPlanResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    displayName: zod_1.z.string(),
    priceCents: zod_1.z.number(),
    currency: zod_1.z.string(),
    interval: zod_1.z.string(),
    trialPeriodDays: zod_1.z.number().nullable(),
    features: zod_1.z.record(zod_1.z.unknown()).nullable(),
    isActive: zod_1.z.boolean(),
    sortOrder: zod_1.z.number(),
});
exports.platformSubscriptionResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    organizationId: zod_1.z.string().uuid(),
    status: zod_1.z.enum([
        'TRIALING',
        'ACTIVE',
        'PAST_DUE',
        'CANCELED',
        'INCOMPLETE',
        'EXPIRED',
    ]),
    plan: exports.platformPlanResponseSchema.nullable(),
    stripeSubscriptionId: zod_1.z.string().nullable(),
    currentPeriodStart: zod_1.z.date().nullable(),
    currentPeriodEnd: zod_1.z.date().nullable(),
    trialEndsAt: zod_1.z.date().nullable(),
    canceledAt: zod_1.z.date().nullable(),
    cancelAtPeriodEnd: zod_1.z.boolean(),
    graceUntil: zod_1.z.date().nullable(),
    isGrandfathered: zod_1.z.boolean(),
    createdAt: zod_1.z.date(),
});
//# sourceMappingURL=platform-subscription.schema.js.map