"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAffiliateSchema = exports.updatePayoutSchema = exports.createPayoutSchema = exports.updateAffiliateSchema = exports.createAffiliateSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createAffiliateSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid(),
    email: zod_1.z.preprocess((value) => {
        if (typeof value !== 'string')
            return value;
        const trimmedValue = value.trim();
        return trimmedValue === '' ? undefined : trimmedValue;
    }, zod_1.z.string().email().optional()),
    name: zod_1.z.string().min(1).max(120).optional(),
    referralCode: zod_1.z
        .string()
        .min(3)
        .max(32)
        .regex(/^[A-Z0-9_-]+$/i, 'Le code ne peut contenir que des lettres, chiffres, tirets et underscores')
        .transform((v) => v.toUpperCase())
        .optional(),
    commissionRate: zod_1.z
        .number()
        .int()
        .min(1)
        .max(100, 'Le taux de commission ne peut pas dépasser 100%'),
    status: zod_1.z.nativeEnum(client_1.AffiliateStatus).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.updateAffiliateSchema = zod_1.z.object({
    email: zod_1.z.preprocess((value) => {
        if (typeof value !== 'string')
            return value;
        const trimmedValue = value.trim();
        return trimmedValue === '' ? undefined : trimmedValue;
    }, zod_1.z.string().email().optional()),
    name: zod_1.z.string().min(1).max(120).optional(),
    referralCode: zod_1.z
        .string()
        .min(3)
        .max(32)
        .regex(/^[A-Z0-9_-]+$/i, 'Le code ne peut contenir que des lettres, chiffres, tirets et underscores')
        .transform((v) => v.toUpperCase())
        .optional(),
    commissionRate: zod_1.z
        .number()
        .int()
        .min(1)
        .max(100, 'Le taux de commission ne peut pas dépasser 100%')
        .optional(),
    status: zod_1.z.nativeEnum(client_1.AffiliateStatus).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.createPayoutSchema = zod_1.z.object({
    amountCents: zod_1.z.number().int().positive(),
    currency: zod_1.z.string().length(3).default('eur'),
    method: zod_1.z.string().max(64).optional(),
    notes: zod_1.z.string().max(500).optional(),
});
exports.updatePayoutSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.PayoutStatus),
    notes: zod_1.z.string().max(500).optional(),
});
exports.validateAffiliateSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    organizationId: zod_1.z.string().uuid(),
});
//# sourceMappingURL=affiliates.schema.js.map