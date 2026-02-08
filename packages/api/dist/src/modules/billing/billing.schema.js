"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSchema = void 0;
const zod_1 = require("zod");
exports.createCheckoutSchema = zod_1.z.object({
    planId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive().max(10).optional(),
    customer: zod_1.z.object({
        telegramUsername: zod_1.z.string().min(1, "Nom d'utilisateur Telegram requis"),
        telegramUserId: zod_1.z.string().optional(),
        displayName: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    }),
});
//# sourceMappingURL=billing.schema.js.map