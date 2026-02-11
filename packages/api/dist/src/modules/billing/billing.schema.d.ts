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
        displayName?: string | undefined;
        email?: string | undefined;
        telegramUserId?: string | undefined;
    }, {
        telegramUsername: string;
        displayName?: string | undefined;
        email?: string | undefined;
        telegramUserId?: string | undefined;
    }>;
    couponCode: z.ZodOptional<z.ZodString>;
    affiliateCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customer: {
        telegramUsername: string;
        displayName?: string | undefined;
        email?: string | undefined;
        telegramUserId?: string | undefined;
    };
    planId: string;
    affiliateCode?: string | undefined;
    couponCode?: string | undefined;
    quantity?: number | undefined;
}, {
    customer: {
        telegramUsername: string;
        displayName?: string | undefined;
        email?: string | undefined;
        telegramUserId?: string | undefined;
    };
    planId: string;
    affiliateCode?: string | undefined;
    couponCode?: string | undefined;
    quantity?: number | undefined;
}>;
export type CreateCheckoutDto = z.infer<typeof createCheckoutSchema>;
