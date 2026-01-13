"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
const metadataSchema = zod_1.z.record(zod_1.z.any()).optional();
const customerBaseSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid(),
    email: zod_1.z.string().email().optional(),
    displayName: zod_1.z.string().min(1).optional(),
    telegramUserId: zod_1.z.string().min(1).optional(),
    telegramUsername: zod_1.z
        .string()
        .regex(/^[A-Za-z0-9_]{5,32}$/, {
        message: 'Le nom d’utilisateur Telegram doit contenir 5 à 32 caractères alphanumériques ou underscores',
    })
        .optional(),
    externalId: zod_1.z.string().min(1).optional(),
    metadata: metadataSchema,
});
exports.createCustomerSchema = customerBaseSchema.superRefine((value, ctx) => {
    if (!(value.email ||
        value.displayName ||
        value.telegramUserId ||
        value.telegramUsername)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Un client doit contenir au moins un moyen d’identification (email, displayName ou identifiants Telegram)',
            path: ['email'],
        });
    }
});
exports.updateCustomerSchema = customerBaseSchema.partial();
//# sourceMappingURL=customers.schema.js.map