"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCouponSchema = exports.updateCouponSchema = exports.createCouponSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createCouponSchema = zod_1.z
    .object({
    organizationId: zod_1.z.string().uuid(),
    code: zod_1.z
        .string()
        .min(3)
        .max(32)
        .regex(/^[A-Z0-9_-]+$/i, 'Le code ne peut contenir que des lettres, chiffres, tirets et underscores')
        .transform((v) => v.toUpperCase()),
    type: zod_1.z.nativeEnum(client_1.CouponType),
    discountValue: zod_1.z.number().int().positive(),
    currency: zod_1.z.string().length(3).optional(),
    maxUses: zod_1.z.number().int().positive().optional(),
    expiresAt: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((v) => (v ? new Date(v) : undefined)),
    planIds: zod_1.z.array(zod_1.z.string().uuid()).optional().default([]),
})
    .refine((data) => {
    if (data.type === client_1.CouponType.PERCENTAGE) {
        return data.discountValue <= 100;
    }
    return true;
}, { message: 'Le pourcentage ne peut pas dépasser 100%', path: ['discountValue'] })
    .refine((data) => {
    if (data.type === client_1.CouponType.FIXED_AMOUNT) {
        return !!data.currency;
    }
    return true;
}, { message: 'La devise est requise pour une réduction fixe', path: ['currency'] });
exports.updateCouponSchema = zod_1.z.object({
    code: zod_1.z
        .string()
        .min(3)
        .max(32)
        .regex(/^[A-Z0-9_-]+$/i, 'Le code ne peut contenir que des lettres, chiffres, tirets et underscores')
        .transform((v) => v.toUpperCase())
        .optional(),
    discountValue: zod_1.z.number().int().positive().optional(),
    currency: zod_1.z.string().length(3).optional(),
    status: zod_1.z.nativeEnum(client_1.CouponStatus).optional(),
    maxUses: zod_1.z.number().int().positive().nullable().optional(),
    expiresAt: zod_1.z
        .string()
        .datetime()
        .nullable()
        .optional()
        .transform((v) => (v ? new Date(v) : v)),
    planIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
exports.validateCouponSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    planId: zod_1.z.string().uuid(),
    organizationId: zod_1.z.string().uuid(),
});
//# sourceMappingURL=coupons.schema.js.map