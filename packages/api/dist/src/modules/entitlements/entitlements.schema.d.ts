import { z } from 'zod';
export declare const createEntitlementSchema: z.ZodObject<{
    subscriptionId: z.ZodString;
    customerId: z.ZodString;
    entitlementKey: z.ZodString;
    type: z.ZodNativeEnum<{
        CHANNEL_ACCESS: "CHANNEL_ACCESS";
        FEATURE_FLAG: "FEATURE_FLAG";
        CONTENT_UNLOCK: "CONTENT_UNLOCK";
        API_QUOTA: "API_QUOTA";
    }>;
    resourceId: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    subscriptionId: string;
    type: "CHANNEL_ACCESS" | "FEATURE_FLAG" | "CONTENT_UNLOCK" | "API_QUOTA";
    entitlementKey: string;
    metadata?: Record<string, unknown> | undefined;
    resourceId?: string | undefined;
    expiresAt?: string | undefined;
}, {
    customerId: string;
    subscriptionId: string;
    type: "CHANNEL_ACCESS" | "FEATURE_FLAG" | "CONTENT_UNLOCK" | "API_QUOTA";
    entitlementKey: string;
    metadata?: Record<string, unknown> | undefined;
    resourceId?: string | undefined;
    expiresAt?: string | undefined;
}>;
export declare const updateEntitlementSchema: z.ZodObject<{
    expiresAt: z.ZodOptional<z.ZodString>;
    revokedAt: z.ZodOptional<z.ZodString>;
    revokeReason: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    metadata?: Record<string, unknown> | undefined;
    revokedAt?: string | undefined;
    revokeReason?: string | undefined;
    expiresAt?: string | undefined;
}, {
    metadata?: Record<string, unknown> | undefined;
    revokedAt?: string | undefined;
    revokeReason?: string | undefined;
    expiresAt?: string | undefined;
}>;
export type CreateEntitlementDto = z.infer<typeof createEntitlementSchema>;
export type UpdateEntitlementDto = z.infer<typeof updateEntitlementSchema>;
