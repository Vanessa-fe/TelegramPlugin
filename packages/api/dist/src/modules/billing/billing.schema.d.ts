import { z } from 'zod';
export declare const createCheckoutSchema: z.ZodObject<{
    planId: z.ZodString;
    quantity: z.ZodOptional<z.ZodNumber>;
    customer: z.ZodObject<{
        telegramUsername: z.ZodString;
        telegramUserId: z.ZodOptional<z.ZodString>;
        displayName: z.ZodOptional<z.ZodString>;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    }, "strip", z.ZodTypeAny, {
        telegramUsername: string;
        email?: string | undefined;
        displayName?: string | undefined;
        telegramUserId?: string | undefined;
    }, {
        telegramUsername: string;
        email?: string | undefined;
        displayName?: string | undefined;
        telegramUserId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    customer: {
        telegramUsername: string;
        email?: string | undefined;
        displayName?: string | undefined;
        telegramUserId?: string | undefined;
    };
    planId: string;
    quantity?: number | undefined;
}, {
    customer: {
        telegramUsername: string;
        email?: string | undefined;
        displayName?: string | undefined;
        telegramUserId?: string | undefined;
    };
    planId: string;
    quantity?: number | undefined;
}>;
export type CreateCheckoutDto = z.infer<typeof createCheckoutSchema>;
