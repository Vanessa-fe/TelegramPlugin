import { z } from 'zod';
export declare const createCouponSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    organizationId: z.ZodString;
    code: z.ZodEffects<z.ZodString, string, string>;
    type: z.ZodNativeEnum<{
        PERCENTAGE: "PERCENTAGE";
        FIXED_AMOUNT: "FIXED_AMOUNT";
    }>;
    discountValue: z.ZodNumber;
    currency: z.ZodOptional<z.ZodString>;
    maxUses: z.ZodOptional<z.ZodNumber>;
    expiresAt: z.ZodEffects<z.ZodOptional<z.ZodString>, Date | undefined, string | undefined>;
    planIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    code: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    planIds: string[];
    currency?: string | undefined;
    expiresAt?: Date | undefined;
    maxUses?: number | undefined;
}, {
    organizationId: string;
    code: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    currency?: string | undefined;
    expiresAt?: string | undefined;
    maxUses?: number | undefined;
    planIds?: string[] | undefined;
}>, {
    organizationId: string;
    code: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    planIds: string[];
    currency?: string | undefined;
    expiresAt?: Date | undefined;
    maxUses?: number | undefined;
}, {
    organizationId: string;
    code: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    currency?: string | undefined;
    expiresAt?: string | undefined;
    maxUses?: number | undefined;
    planIds?: string[] | undefined;
}>, {
    organizationId: string;
    code: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    planIds: string[];
    currency?: string | undefined;
    expiresAt?: Date | undefined;
    maxUses?: number | undefined;
}, {
    organizationId: string;
    code: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    currency?: string | undefined;
    expiresAt?: string | undefined;
    maxUses?: number | undefined;
    planIds?: string[] | undefined;
}>;
export type CreateCouponDto = z.infer<typeof createCouponSchema>;
export declare const updateCouponSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    discountValue: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<{
        ACTIVE: "ACTIVE";
        EXPIRED: "EXPIRED";
        DISABLED: "DISABLED";
    }>>;
    maxUses: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    expiresAt: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | Date | null | undefined, string | null | undefined>;
    planIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    currency?: string | undefined;
    status?: "ACTIVE" | "EXPIRED" | "DISABLED" | undefined;
    code?: string | undefined;
    expiresAt?: string | Date | null | undefined;
    discountValue?: number | undefined;
    maxUses?: number | null | undefined;
    planIds?: string[] | undefined;
}, {
    currency?: string | undefined;
    status?: "ACTIVE" | "EXPIRED" | "DISABLED" | undefined;
    code?: string | undefined;
    expiresAt?: string | null | undefined;
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
