import { z } from 'zod';
export declare const createTelegramStarsInvoiceSchema: z.ZodObject<{
    planId: z.ZodString;
    customer: z.ZodObject<{
        telegramUserId: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>, string, string | number>;
        telegramUsername: z.ZodOptional<z.ZodString>;
        displayName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        telegramUserId: string;
        displayName?: string | undefined;
        telegramUsername?: string | undefined;
    }, {
        telegramUserId: string | number;
        displayName?: string | undefined;
        telegramUsername?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    customer: {
        telegramUserId: string;
        displayName?: string | undefined;
        telegramUsername?: string | undefined;
    };
    planId: string;
}, {
    customer: {
        telegramUserId: string | number;
        displayName?: string | undefined;
        telegramUsername?: string | undefined;
    };
    planId: string;
}>;
export type CreateTelegramStarsInvoiceDto = z.infer<typeof createTelegramStarsInvoiceSchema>;
export declare const telegramStarsWebhookSchema: z.ZodObject<{
    telegramPaymentChargeId: z.ZodString;
    telegramUserId: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>, string, string | number>;
    totalAmount: z.ZodNumber;
    invoicePayload: z.ZodString;
    providerPaymentChargeId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    telegramUserId: string;
    telegramPaymentChargeId: string;
    totalAmount: number;
    invoicePayload: string;
    providerPaymentChargeId?: string | undefined;
}, {
    telegramUserId: string | number;
    telegramPaymentChargeId: string;
    totalAmount: number;
    invoicePayload: string;
    providerPaymentChargeId?: string | undefined;
}>;
export type TelegramStarsWebhookDto = z.infer<typeof telegramStarsWebhookSchema>;
export declare const validatePreCheckoutSchema: z.ZodObject<{
    invoicePayload: z.ZodString;
}, "strip", z.ZodTypeAny, {
    invoicePayload: string;
}, {
    invoicePayload: string;
}>;
export type ValidatePreCheckoutDto = z.infer<typeof validatePreCheckoutSchema>;
