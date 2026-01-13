import { z } from 'zod';
export declare const createCustomerSchema: z.ZodEffects<z.ZodObject<{
    organizationId: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodString>;
    telegramUserId: z.ZodOptional<z.ZodString>;
    telegramUsername: z.ZodOptional<z.ZodString>;
    externalId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    externalId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    email?: string | undefined;
    displayName?: string | undefined;
    telegramUserId?: string | undefined;
    telegramUsername?: string | undefined;
}, {
    organizationId: string;
    externalId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    email?: string | undefined;
    displayName?: string | undefined;
    telegramUserId?: string | undefined;
    telegramUsername?: string | undefined;
}>, {
    organizationId: string;
    externalId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    email?: string | undefined;
    displayName?: string | undefined;
    telegramUserId?: string | undefined;
    telegramUsername?: string | undefined;
}, {
    organizationId: string;
    externalId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    email?: string | undefined;
    displayName?: string | undefined;
    telegramUserId?: string | undefined;
    telegramUsername?: string | undefined;
}>;
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export declare const updateCustomerSchema: z.ZodObject<{
    organizationId: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    displayName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    telegramUserId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    telegramUsername: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    externalId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string | undefined;
    externalId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    email?: string | undefined;
    displayName?: string | undefined;
    telegramUserId?: string | undefined;
    telegramUsername?: string | undefined;
}, {
    organizationId?: string | undefined;
    externalId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    email?: string | undefined;
    displayName?: string | undefined;
    telegramUserId?: string | undefined;
    telegramUsername?: string | undefined;
}>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
