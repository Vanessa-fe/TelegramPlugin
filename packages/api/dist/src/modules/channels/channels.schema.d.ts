import { z } from 'zod';
export declare const createChannelSchema: z.ZodObject<{
    organizationId: z.ZodString;
    provider: z.ZodNativeEnum<{
        TELEGRAM: "TELEGRAM";
        DISCORD: "DISCORD";
    }>;
    externalId: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    inviteLink: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    externalId: string;
    provider: "TELEGRAM" | "DISCORD";
    isActive?: boolean | undefined;
    metadata?: Record<string, any> | undefined;
    inviteLink?: string | undefined;
    title?: string | undefined;
    username?: string | undefined;
}, {
    organizationId: string;
    externalId: string;
    provider: "TELEGRAM" | "DISCORD";
    isActive?: boolean | undefined;
    metadata?: Record<string, any> | undefined;
    inviteLink?: string | undefined;
    title?: string | undefined;
    username?: string | undefined;
}>;
export type CreateChannelDto = z.infer<typeof createChannelSchema>;
export declare const updateChannelSchema: z.ZodObject<{
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    inviteLink: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    username: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    organizationId: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodNativeEnum<{
        TELEGRAM: "TELEGRAM";
        DISCORD: "DISCORD";
    }>>;
    externalId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    organizationId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    externalId?: string | undefined;
    provider?: "TELEGRAM" | "DISCORD" | undefined;
    inviteLink?: string | undefined;
    title?: string | undefined;
    username?: string | undefined;
}, {
    isActive?: boolean | undefined;
    organizationId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    externalId?: string | undefined;
    provider?: "TELEGRAM" | "DISCORD" | undefined;
    inviteLink?: string | undefined;
    title?: string | undefined;
    username?: string | undefined;
}>;
export type UpdateChannelDto = z.infer<typeof updateChannelSchema>;
