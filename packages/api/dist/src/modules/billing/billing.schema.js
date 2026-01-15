"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSchema = void 0;
const zod_1 = require("zod");
exports.createCheckoutSchema = zod_1.z.object({
    planId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive().max(10).optional(),
    customer: zod_1.z
        .object({
        email: zod_1.z.string().email().optional(),
        telegramUserId: zod_1.z.string().optional(),
        telegramUsername: zod_1.z.string().optional(),
        displayName: zod_1.z.string().optional(),
    })
        .refine((value) => value.email || value.telegramUserId, {
        message: 'Email ou identifiant Telegram requis',
    }),
});
//# sourceMappingURL=billing.schema.js.map