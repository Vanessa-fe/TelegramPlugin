import { z } from 'zod';
export declare const startVerificationSchema: z.ZodObject<{
    type: z.ZodNativeEnum<{
        CHANNEL: "CHANNEL";
        GROUP: "GROUP";
    }>;
    provider: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<{
        TELEGRAM: "TELEGRAM";
        DISCORD: "DISCORD";
    }>>>;
}, "strip", z.ZodTypeAny, {
    provider: "TELEGRAM" | "DISCORD";
    type: "CHANNEL" | "GROUP";
}, {
    type: "CHANNEL" | "GROUP";
    provider?: "TELEGRAM" | "DISCORD" | undefined;
}>;
export type StartVerificationDto = z.infer<typeof startVerificationSchema>;
export declare const verifyChannelSchema: z.ZodObject<{
    code: z.ZodString;
    telegramChatId: z.ZodString;
    telegramTitle: z.ZodString;
    telegramUsername: z.ZodNullable<z.ZodString>;
    chatType: z.ZodEnum<["CHANNEL", "GROUP"]>;
}, "strip", z.ZodTypeAny, {
    telegramUsername: string | null;
    code: string;
    telegramChatId: string;
    telegramTitle: string;
    chatType: "CHANNEL" | "GROUP";
}, {
    telegramUsername: string | null;
    code: string;
    telegramChatId: string;
    telegramTitle: string;
    chatType: "CHANNEL" | "GROUP";
}>;
export type VerifyChannelDto = z.infer<typeof verifyChannelSchema>;
export declare const verifyDiscordChannelSchema: z.ZodObject<{
    code: z.ZodString;
    discordGuildId: z.ZodString;
    discordGuildName: z.ZodString;
    roles: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        color: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        color?: string | undefined;
        position?: number | undefined;
    }, {
        id: string;
        name: string;
        color?: string | undefined;
        position?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    code: string;
    discordGuildId: string;
    discordGuildName: string;
    roles?: {
        id: string;
        name: string;
        color?: string | undefined;
        position?: number | undefined;
    }[] | undefined;
}, {
    code: string;
    discordGuildId: string;
    discordGuildName: string;
    roles?: {
        id: string;
        name: string;
        color?: string | undefined;
        position?: number | undefined;
    }[] | undefined;
}>;
export type VerifyDiscordChannelDto = z.infer<typeof verifyDiscordChannelSchema>;
export declare const setDiscordRoleSchema: z.ZodObject<{
    roleId: z.ZodString;
    roleName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    roleId: string;
    roleName?: string | undefined;
}, {
    roleId: string;
    roleName?: string | undefined;
}>;
export type SetDiscordRoleDto = z.infer<typeof setDiscordRoleSchema>;
export declare const confirmVerificationSchema: z.ZodObject<{
    verificationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    verificationId: string;
}, {
    verificationId: string;
}>;
export type ConfirmVerificationDto = z.infer<typeof confirmVerificationSchema>;
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
