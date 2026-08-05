import { z } from 'zod';
export declare const createCouponSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    organizationId: z.ZodString;
    code: z.ZodEffects<z.ZodString, string, string>;
    type: z.ZodNativeEnum<{
        PERCENTAGE: "PERCENTAGE";
        FIXED_AMOUNT: "FIXED_AMOUNT";
    }>;
    discountValue: z.ZodNumber;
    currency: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    maxUses: z.ZodOptional<z.ZodNumber>;
    expiresAt: z.ZodEffects<z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, Date, string>>, Date | undefined, unknown>;
    planIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    code: string;
    discountValue: number;
    planIds: string[];
    currency?: string | undefined;
    expiresAt?: Date | undefined;
    maxUses?: number | undefined;
}, {
    organizationId: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    code: string;
    discountValue: number;
    currency?: string | undefined;
    expiresAt?: unknown;
    maxUses?: number | undefined;
    planIds?: string[] | undefined;
}>, {
    organizationId: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    code: string;
    discountValue: number;
    planIds: string[];
    currency?: string | undefined;
    expiresAt?: Date | undefined;
    maxUses?: number | undefined;
}, {
    organizationId: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    code: string;
    discountValue: number;
    currency?: string | undefined;
    expiresAt?: unknown;
    maxUses?: number | undefined;
    planIds?: string[] | undefined;
}>, {
    organizationId: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    code: string;
    discountValue: number;
    planIds: string[];
    currency?: string | undefined;
    expiresAt?: Date | undefined;
    maxUses?: number | undefined;
}, {
    organizationId: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    code: string;
    discountValue: number;
    currency?: string | undefined;
    expiresAt?: unknown;
    maxUses?: number | undefined;
    planIds?: string[] | undefined;
}>;
export type CreateCouponDto = z.infer<typeof createCouponSchema>;
export declare const updateCouponSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    discountValue: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    status: z.ZodOptional<z.ZodNativeEnum<{
        ACTIVE: "ACTIVE";
        EXPIRED: "EXPIRED";
        DISABLED: "DISABLED";
    }>>;
    maxUses: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    expiresAt: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, Date, string>, z.ZodNull]>>, Date | null | undefined, unknown>;
    planIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    currency?: string | undefined;
    status?: "ACTIVE" | "EXPIRED" | "DISABLED" | undefined;
    code?: string | undefined;
    expiresAt?: Date | null | undefined;
    discountValue?: number | undefined;
    maxUses?: number | null | undefined;
    planIds?: string[] | undefined;
}, {
    currency?: string | undefined;
    status?: "ACTIVE" | "EXPIRED" | "DISABLED" | undefined;
    code?: string | undefined;
    expiresAt?: unknown;
    discountValue?: number | undefined;
    maxUses?: number | null | undefined;
    planIds?: string[] | undefined;
}>;
export type UpdateCouponDto = z.infer<typeof updateCouponSchema>;
export declare const validateCouponSchema: z.ZodObject<{
    code: z.ZodString;
    planId: z.ZodString;
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    planId: string;
    code: string;
}, {
    organizationId: string;
    planId: string;
    code: string;
}>;
export type ValidateCouponDto = z.infer<typeof validateCouponSchema>;
