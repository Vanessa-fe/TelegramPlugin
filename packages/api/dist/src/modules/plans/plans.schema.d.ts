import { z } from 'zod';
export declare const createPlanSchema: z.ZodObject<{
    productId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    interval: z.ZodNativeEnum<{
        ONE_TIME: "ONE_TIME";
        DAY: "DAY";
        WEEK: "WEEK";
        MONTH: "MONTH";
        QUARTER: "QUARTER";
        YEAR: "YEAR";
    }>;
    priceCents: z.ZodNumber;
    currency: z.ZodEffects<z.ZodString, string, string>;
    trialPeriodDays: z.ZodOptional<z.ZodNumber>;
    accessDurationDays: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    productId: string;
    interval: "ONE_TIME" | "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
    priceCents: number;
    currency: string;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    trialPeriodDays?: number | undefined;
    accessDurationDays?: number | undefined;
    isActive?: boolean | undefined;
}, {
    name: string;
    productId: string;
    interval: "ONE_TIME" | "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
    priceCents: number;
    currency: string;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    trialPeriodDays?: number | undefined;
    accessDurationDays?: number | undefined;
    isActive?: boolean | undefined;
}>;
export type CreatePlanDto = z.infer<typeof createPlanSchema>;
export declare const updatePlanSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    interval: z.ZodOptional<z.ZodNativeEnum<{
        ONE_TIME: "ONE_TIME";
        DAY: "DAY";
        WEEK: "WEEK";
        MONTH: "MONTH";
        QUARTER: "QUARTER";
        YEAR: "YEAR";
    }>>;
    priceCents: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    trialPeriodDays: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    accessDurationDays: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
} & {
    productId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    productId?: string | undefined;
    interval?: "ONE_TIME" | "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR" | undefined;
    priceCents?: number | undefined;
    currency?: string | undefined;
    trialPeriodDays?: number | undefined;
    accessDurationDays?: number | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    productId?: string | undefined;
    interval?: "ONE_TIME" | "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR" | undefined;
    priceCents?: number | undefined;
    currency?: string | undefined;
    trialPeriodDays?: number | undefined;
    accessDurationDays?: number | undefined;
    isActive?: boolean | undefined;
}>;
export type UpdatePlanDto = z.infer<typeof updatePlanSchema>;
