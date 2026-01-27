import { z } from 'zod';
export declare const createCheckoutSchema: z.ZodObject<{
    planId: z.ZodString;
    quantity: z.ZodOptional<z.ZodNumber>;
    customer: z.ZodEffects<z.ZodObject<{
        email: z.ZodOptional<z.ZodString>;
        telegramUserId: z.ZodOptional<z.ZodString>;
        telegramUsername: z.ZodOptional<z.ZodString>;
        displayName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        displayName?: string | undefined;
        email?: string | undefined;
        telegramUserId?: string | undefined;
        telegramUsername?: string | undefined;
    }, {
        displayName?: string | undefined;
        email?: string | undefined;
        telegramUserId?: string | undefined;
        telegramUsername?: string | undefined;
    }>, {
        displayName?: string | undefined;
        email?: string | undefined;
        telegramUserId?: string | undefined;
        telegramUsername?: string | undefined;
    }, {
        displayName?: string | undefined;
        email?: string | undefined;
        telegramUserId?: string | undefined;
        telegramUsername?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    customer: {
        displayName?: string | undefined;
        email?: string | undefined;
        telegramUserId?: string | undefined;
        telegramUsername?: string | undefined;
    };
    planId: string;
    quantity?: number | undefined;
}, {
    customer: {
        displayName?: string | undefined;
        email?: string | undefined;
        telegramUserId?: string | undefined;
        telegramUsername?: string | undefined;
    };
    planId: string;
    quantity?: number | undefined;
}>;
export type CreateCheckoutDto = z.infer<typeof createCheckoutSchema>;
