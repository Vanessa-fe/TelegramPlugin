import { z } from 'zod';
export declare const createPlatformCheckoutSchema: z.ZodObject<{
    planName: z.ZodEnum<["early-adopter", "pro"]>;
}, "strip", z.ZodTypeAny, {
    planName: "early-adopter" | "pro";
}, {
    planName: "early-adopter" | "pro";
}>;
export type CreatePlatformCheckoutDto = z.infer<typeof createPlatformCheckoutSchema>;
export declare const platformPlanResponseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    displayName: z.ZodString;
    priceCents: z.ZodNumber;
    currency: z.ZodString;
    interval: z.ZodString;
    trialPeriodDays: z.ZodNullable<z.ZodNumber>;
    features: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    isActive: z.ZodBoolean;
    sortOrder: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    displayName: string;
    priceCents: number;
    currency: string;
    interval: string;
    trialPeriodDays: number | null;
    features: Record<string, unknown> | null;
    isActive: boolean;
    sortOrder: number;
}, {
    id: string;
    name: string;
    displayName: string;
    priceCents: number;
    currency: string;
    interval: string;
    trialPeriodDays: number | null;
    features: Record<string, unknown> | null;
    isActive: boolean;
    sortOrder: number;
}>;
export type PlatformPlanResponse = z.infer<typeof platformPlanResponseSchema>;
export declare const platformSubscriptionResponseSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    status: z.ZodEnum<["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "INCOMPLETE", "EXPIRED"]>;
    plan: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        displayName: z.ZodString;
        priceCents: z.ZodNumber;
        currency: z.ZodString;
        interval: z.ZodString;
        trialPeriodDays: z.ZodNullable<z.ZodNumber>;
        features: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        isActive: z.ZodBoolean;
        sortOrder: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        displayName: string;
        priceCents: number;
        currency: string;
        interval: string;
        trialPeriodDays: number | null;
        features: Record<string, unknown> | null;
        isActive: boolean;
        sortOrder: number;
    }, {
        id: string;
        name: string;
        displayName: string;
        priceCents: number;
        currency: string;
        interval: string;
        trialPeriodDays: number | null;
        features: Record<string, unknown> | null;
        isActive: boolean;
        sortOrder: number;
    }>>;
    stripeSubscriptionId: z.ZodNullable<z.ZodString>;
    currentPeriodStart: z.ZodNullable<z.ZodDate>;
    currentPeriodEnd: z.ZodNullable<z.ZodDate>;
    trialEndsAt: z.ZodNullable<z.ZodDate>;
    canceledAt: z.ZodNullable<z.ZodDate>;
    cancelAtPeriodEnd: z.ZodBoolean;
    graceUntil: z.ZodNullable<z.ZodDate>;
    isGrandfathered: z.ZodBoolean;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    organizationId: string;
    status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "EXPIRED";
    stripeSubscriptionId: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    trialEndsAt: Date | null;
    canceledAt: Date | null;
    cancelAtPeriodEnd: boolean;
    graceUntil: Date | null;
    plan: {
        id: string;
        name: string;
        displayName: string;
        priceCents: number;
        currency: string;
        interval: string;
        trialPeriodDays: number | null;
        features: Record<string, unknown> | null;
        isActive: boolean;
        sortOrder: number;
    } | null;
    isGrandfathered: boolean;
}, {
    id: string;
    createdAt: Date;
    organizationId: string;
    status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "EXPIRED";
    stripeSubscriptionId: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    trialEndsAt: Date | null;
    canceledAt: Date | null;
    cancelAtPeriodEnd: boolean;
    graceUntil: Date | null;
    plan: {
        id: string;
        name: string;
        displayName: string;
        priceCents: number;
        currency: string;
        interval: string;
        trialPeriodDays: number | null;
        features: Record<string, unknown> | null;
        isActive: boolean;
        sortOrder: number;
    } | null;
    isGrandfathered: boolean;
}>;
export type PlatformSubscriptionResponse = z.infer<typeof platformSubscriptionResponseSchema>;
