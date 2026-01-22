"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePreCheckoutSchema = exports.telegramStarsWebhookSchema = exports.createTelegramStarsInvoiceSchema = void 0;
const zod_1 = require("zod");
const telegramUserIdSchema = zod_1.z
    .union([zod_1.z.string(), zod_1.z.number()])
    .transform((value) => String(value).trim())
    .refine((value) => value.length > 0, {
    message: 'telegramUserId requis',
});
exports.createTelegramStarsInvoiceSchema = zod_1.z.object({
    planId: zod_1.z.string().uuid(),
    customer: zod_1.z.object({
        telegramUserId: telegramUserIdSchema,
        telegramUsername: zod_1.z.string().optional(),
        displayName: zod_1.z.string().optional(),
    }),
});
exports.telegramStarsWebhookSchema = zod_1.z.object({
    telegramPaymentChargeId: zod_1.z.string().min(1),
    telegramUserId: telegramUserIdSchema,
    totalAmount: zod_1.z.coerce.number().int().positive(),
    invoicePayload: zod_1.z.string().min(1),
    providerPaymentChargeId: zod_1.z.string().optional(),
});
exports.validatePreCheckoutSchema = zod_1.z.object({
    invoicePayload: zod_1.z.string().min(1),
});
//# sourceMappingURL=telegram-stars.schema.js.map