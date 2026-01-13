"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlanSchema = exports.createPlanSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const metadataSchema = zod_1.z.record(zod_1.z.any()).optional();
exports.createPlanSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1).optional(),
    interval: zod_1.z.nativeEnum(client_1.PlanInterval),
    priceCents: zod_1.z.number().int().positive(),
    currency: zod_1.z
        .string()
        .length(3)
        .regex(/^[A-Za-z]{3}$/, 'Le code devise doit être au format ISO 4217')
        .transform((value) => value.toUpperCase()),
    trialPeriodDays: zod_1.z.number().int().nonnegative().optional(),
    accessDurationDays: zod_1.z.number().int().positive().optional(),
    isActive: zod_1.z.boolean().optional(),
    metadata: metadataSchema,
});
exports.updatePlanSchema = exports.createPlanSchema
    .omit({ productId: true })
    .partial()
    .extend({
    productId: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=plans.schema.js.map