import { z } from 'zod';
export declare const createProductSchema: z.ZodObject<{
    organizationId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<{
        DRAFT: "DRAFT";
        ACTIVE: "ACTIVE";
        ARCHIVED: "ARCHIVED";
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    organizationId: string;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    status?: "ACTIVE" | "DRAFT" | "ARCHIVED" | undefined;
}, {
    name: string;
    organizationId: string;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    status?: "ACTIVE" | "DRAFT" | "ARCHIVED" | undefined;
}>;
export type CreateProductDto = z.infer<typeof createProductSchema>;
export declare const updateProductSchema: z.ZodObject<{
    organizationId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodNativeEnum<{
        DRAFT: "DRAFT";
        ACTIVE: "ACTIVE";
        ARCHIVED: "ARCHIVED";
    }>>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    organizationId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    status?: "ACTIVE" | "DRAFT" | "ARCHIVED" | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    organizationId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    status?: "ACTIVE" | "DRAFT" | "ARCHIVED" | undefined;
}>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
