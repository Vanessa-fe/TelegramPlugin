import { z } from 'zod';
export declare const createOrganizationSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodEffects<z.ZodString, string, string>;
    billingEmail: z.ZodString;
    timezone: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    billingEmail: string;
    metadata?: Record<string, any> | undefined;
    timezone?: string | undefined;
}, {
    name: string;
    slug: string;
    billingEmail: string;
    metadata?: Record<string, any> | undefined;
    timezone?: string | undefined;
}>;
export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
export declare const updateOrganizationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    billingEmail: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
} & {
    slug: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    metadata?: Record<string, any> | undefined;
    slug?: string | undefined;
    billingEmail?: string | undefined;
    timezone?: string | undefined;
}, {
    name?: string | undefined;
    metadata?: Record<string, any> | undefined;
    slug?: string | undefined;
    billingEmail?: string | undefined;
    timezone?: string | undefined;
}>;
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;
