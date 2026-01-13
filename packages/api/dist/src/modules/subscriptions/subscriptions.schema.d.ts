import { z } from 'zod';
export declare const createSubscriptionSchema: z.ZodObject<{
    organizationId: z.ZodString;
    customerId: z.ZodString;
    planId: z.ZodString;
    status: z.ZodOptional<z.ZodNativeEnum<{
        ACTIVE: "ACTIVE";
        PAST_DUE: "PAST_DUE";
        CANCELED: "CANCELED";
        INCOMPLETE: "INCOMPLETE";
        TRIALING: "TRIALING";
        EXPIRED: "EXPIRED";
    }>>;
    externalId: z.ZodOptional<z.ZodString>;
    externalCustomerId: z.ZodOptional<z.ZodString>;
    externalPriceId: z.ZodOptional<z.ZodString>;
    currentPeriodStart: z.ZodOptional<z.ZodDate>;
    currentPeriodEnd: z.ZodOptional<z.ZodDate>;
    trialEndsAt: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    customerId: string;
    planId: string;
    status?: "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "TRIALING" | "EXPIRED" | undefined;
    externalId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    externalCustomerId?: string | undefined;
    externalPriceId?: string | undefined;
    currentPeriodStart?: Date | undefined;
    currentPeriodEnd?: Date | undefined;
    trialEndsAt?: Date | undefined;
}, {
    organizationId: string;
    customerId: string;
    planId: string;
    status?: "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "TRIALING" | "EXPIRED" | undefined;
    externalId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    externalCustomerId?: string | undefined;
    externalPriceId?: string | undefined;
    currentPeriodStart?: Date | undefined;
    currentPeriodEnd?: Date | undefined;
    trialEndsAt?: Date | undefined;
}>;
export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
export declare const updateSubscriptionSchema: z.ZodObject<{
    organizationId: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodString>;
    planId: z.ZodOptional<z.ZodString>;
    externalId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    externalCustomerId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    externalPriceId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    currentPeriodStart: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    currentPeriodEnd: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    trialEndsAt: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
} & {
    status: z.ZodOptional<z.ZodNativeEnum<{
        ACTIVE: "ACTIVE";
        PAST_DUE: "PAST_DUE";
        CANCELED: "CANCELED";
        INCOMPLETE: "INCOMPLETE";
        TRIALING: "TRIALING";
        EXPIRED: "EXPIRED";
    }>>;
    canceledAt: z.ZodOptional<z.ZodDate>;
    endedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string | undefined;
    status?: "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "TRIALING" | "EXPIRED" | undefined;
    externalId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    customerId?: string | undefined;
    planId?: string | undefined;
    externalCustomerId?: string | undefined;
    externalPriceId?: string | undefined;
    currentPeriodStart?: Date | undefined;
    currentPeriodEnd?: Date | undefined;
    trialEndsAt?: Date | undefined;
    canceledAt?: Date | undefined;
    endedAt?: Date | undefined;
}, {
    organizationId?: string | undefined;
    status?: "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "TRIALING" | "EXPIRED" | undefined;
    externalId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    customerId?: string | undefined;
    planId?: string | undefined;
    externalCustomerId?: string | undefined;
    externalPriceId?: string | undefined;
    currentPeriodStart?: Date | undefined;
    currentPeriodEnd?: Date | undefined;
    trialEndsAt?: Date | undefined;
    canceledAt?: Date | undefined;
    endedAt?: Date | undefined;
}>;
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
