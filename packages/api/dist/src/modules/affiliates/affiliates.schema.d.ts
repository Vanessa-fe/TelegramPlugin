import { z } from 'zod';
export declare const createAffiliateSchema: z.ZodObject<{
    organizationId: z.ZodString;
    email: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    name: z.ZodOptional<z.ZodString>;
    referralCode: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    commissionRate: z.ZodNumber;
    status: z.ZodOptional<z.ZodNativeEnum<{
        PENDING: "PENDING";
        ACTIVE: "ACTIVE";
        SUSPENDED: "SUSPENDED";
        DEACTIVATED: "DEACTIVATED";
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    commissionRate: number;
    name?: string | undefined;
    status?: "ACTIVE" | "PENDING" | "SUSPENDED" | "DEACTIVATED" | undefined;
    metadata?: Record<string, any> | undefined;
    email?: string | undefined;
    referralCode?: string | undefined;
}, {
    organizationId: string;
    commissionRate: number;
    name?: string | undefined;
    status?: "ACTIVE" | "PENDING" | "SUSPENDED" | "DEACTIVATED" | undefined;
    metadata?: Record<string, any> | undefined;
    email?: unknown;
    referralCode?: string | undefined;
}>;
export type CreateAffiliateDto = z.infer<typeof createAffiliateSchema>;
export declare const updateAffiliateSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    name: z.ZodOptional<z.ZodString>;
    referralCode: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    commissionRate: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodNativeEnum<{
        PENDING: "PENDING";
        ACTIVE: "ACTIVE";
        SUSPENDED: "SUSPENDED";
        DEACTIVATED: "DEACTIVATED";
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    status?: "ACTIVE" | "PENDING" | "SUSPENDED" | "DEACTIVATED" | undefined;
    metadata?: Record<string, any> | undefined;
    email?: string | undefined;
    referralCode?: string | undefined;
    commissionRate?: number | undefined;
}, {
    name?: string | undefined;
    status?: "ACTIVE" | "PENDING" | "SUSPENDED" | "DEACTIVATED" | undefined;
    metadata?: Record<string, any> | undefined;
    email?: unknown;
    referralCode?: string | undefined;
    commissionRate?: number | undefined;
}>;
export type UpdateAffiliateDto = z.infer<typeof updateAffiliateSchema>;
export declare const createPayoutSchema: z.ZodObject<{
    amountCents: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    method: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currency: string;
    amountCents: number;
    notes?: string | undefined;
    method?: string | undefined;
}, {
    amountCents: number;
    currency?: string | undefined;
    notes?: string | undefined;
    method?: string | undefined;
}>;
export type CreatePayoutDto = z.infer<typeof createPayoutSchema>;
export declare const updatePayoutSchema: z.ZodObject<{
    status: z.ZodNativeEnum<{
        PENDING: "PENDING";
        PROCESSING: "PROCESSING";
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
    }>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    notes?: string | undefined;
}, {
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    notes?: string | undefined;
}>;
export type UpdatePayoutDto = z.infer<typeof updatePayoutSchema>;
export declare const validateAffiliateSchema: z.ZodObject<{
    code: z.ZodString;
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    code: string;
}, {
    organizationId: string;
    code: string;
}>;
export type ValidateAffiliateDto = z.infer<typeof validateAffiliateSchema>;
