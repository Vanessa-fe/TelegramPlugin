import { z } from 'zod';
export declare const socialLinkSchema: z.ZodObject<{
    platform: z.ZodNativeEnum<{
        INSTAGRAM: "INSTAGRAM";
        YOUTUBE: "YOUTUBE";
        TWITTER: "TWITTER";
        TIKTOK: "TIKTOK";
        TELEGRAM: "TELEGRAM";
        DISCORD: "DISCORD";
        LINKEDIN: "LINKEDIN";
        WEBSITE: "WEBSITE";
    }>;
    url: z.ZodString;
    order: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    platform: "TELEGRAM" | "DISCORD" | "INSTAGRAM" | "YOUTUBE" | "TWITTER" | "TIKTOK" | "LINKEDIN" | "WEBSITE";
    url: string;
    order: number;
}, {
    platform: "TELEGRAM" | "DISCORD" | "INSTAGRAM" | "YOUTUBE" | "TWITTER" | "TIKTOK" | "LINKEDIN" | "WEBSITE";
    url: string;
    order: number;
}>;
export type SocialLinkDto = z.infer<typeof socialLinkSchema>;
export declare const updateSocialLinksSchema: z.ZodObject<{
    socialLinks: z.ZodArray<z.ZodObject<{
        platform: z.ZodNativeEnum<{
            INSTAGRAM: "INSTAGRAM";
            YOUTUBE: "YOUTUBE";
            TWITTER: "TWITTER";
            TIKTOK: "TIKTOK";
            TELEGRAM: "TELEGRAM";
            DISCORD: "DISCORD";
            LINKEDIN: "LINKEDIN";
            WEBSITE: "WEBSITE";
        }>;
        url: z.ZodString;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        platform: "TELEGRAM" | "DISCORD" | "INSTAGRAM" | "YOUTUBE" | "TWITTER" | "TIKTOK" | "LINKEDIN" | "WEBSITE";
        url: string;
        order: number;
    }, {
        platform: "TELEGRAM" | "DISCORD" | "INSTAGRAM" | "YOUTUBE" | "TWITTER" | "TIKTOK" | "LINKEDIN" | "WEBSITE";
        url: string;
        order: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    socialLinks: {
        platform: "TELEGRAM" | "DISCORD" | "INSTAGRAM" | "YOUTUBE" | "TWITTER" | "TIKTOK" | "LINKEDIN" | "WEBSITE";
        url: string;
        order: number;
    }[];
}, {
    socialLinks: {
        platform: "TELEGRAM" | "DISCORD" | "INSTAGRAM" | "YOUTUBE" | "TWITTER" | "TIKTOK" | "LINKEDIN" | "WEBSITE";
        url: string;
        order: number;
    }[];
}>;
export type UpdateSocialLinksDto = z.infer<typeof updateSocialLinksSchema>;
export declare const elementSettingsSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
export declare const landingPageElementSchema: z.ZodObject<{
    type: z.ZodNativeEnum<{
        SOCIAL_LINKS: "SOCIAL_LINKS";
        IMAGE: "IMAGE";
        HEADING_1: "HEADING_1";
        HEADING_2: "HEADING_2";
        HEADING_3: "HEADING_3";
        TEXT: "TEXT";
        PRODUCTS: "PRODUCTS";
        LINK: "LINK";
        DIVIDER: "DIVIDER";
    }>;
    order: z.ZodNumber;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    linkUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type: "SOCIAL_LINKS" | "IMAGE" | "HEADING_1" | "HEADING_2" | "HEADING_3" | "TEXT" | "PRODUCTS" | "LINK" | "DIVIDER";
    order: number;
    content?: string | null | undefined;
    imageUrl?: string | null | undefined;
    linkUrl?: string | null | undefined;
    settings?: Record<string, any> | undefined;
}, {
    type: "SOCIAL_LINKS" | "IMAGE" | "HEADING_1" | "HEADING_2" | "HEADING_3" | "TEXT" | "PRODUCTS" | "LINK" | "DIVIDER";
    order: number;
    content?: string | null | undefined;
    imageUrl?: string | null | undefined;
    linkUrl?: string | null | undefined;
    settings?: Record<string, any> | undefined;
}>;
export type LandingPageElementDto = z.infer<typeof landingPageElementSchema>;
export declare const createElementSchema: z.ZodObject<{
    type: z.ZodNativeEnum<{
        SOCIAL_LINKS: "SOCIAL_LINKS";
        IMAGE: "IMAGE";
        HEADING_1: "HEADING_1";
        HEADING_2: "HEADING_2";
        HEADING_3: "HEADING_3";
        TEXT: "TEXT";
        PRODUCTS: "PRODUCTS";
        LINK: "LINK";
        DIVIDER: "DIVIDER";
    }>;
    order: z.ZodNumber;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    linkUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type: "SOCIAL_LINKS" | "IMAGE" | "HEADING_1" | "HEADING_2" | "HEADING_3" | "TEXT" | "PRODUCTS" | "LINK" | "DIVIDER";
    order: number;
    content?: string | null | undefined;
    imageUrl?: string | null | undefined;
    linkUrl?: string | null | undefined;
    settings?: Record<string, any> | undefined;
}, {
    type: "SOCIAL_LINKS" | "IMAGE" | "HEADING_1" | "HEADING_2" | "HEADING_3" | "TEXT" | "PRODUCTS" | "LINK" | "DIVIDER";
    order: number;
    content?: string | null | undefined;
    imageUrl?: string | null | undefined;
    linkUrl?: string | null | undefined;
    settings?: Record<string, any> | undefined;
}>;
export type CreateElementDto = z.infer<typeof createElementSchema>;
export declare const updateElementSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodNativeEnum<{
        SOCIAL_LINKS: "SOCIAL_LINKS";
        IMAGE: "IMAGE";
        HEADING_1: "HEADING_1";
        HEADING_2: "HEADING_2";
        HEADING_3: "HEADING_3";
        TEXT: "TEXT";
        PRODUCTS: "PRODUCTS";
        LINK: "LINK";
        DIVIDER: "DIVIDER";
    }>>;
    order: z.ZodOptional<z.ZodNumber>;
    content: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    imageUrl: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    linkUrl: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    type?: "SOCIAL_LINKS" | "IMAGE" | "HEADING_1" | "HEADING_2" | "HEADING_3" | "TEXT" | "PRODUCTS" | "LINK" | "DIVIDER" | undefined;
    order?: number | undefined;
    content?: string | null | undefined;
    imageUrl?: string | null | undefined;
    linkUrl?: string | null | undefined;
    settings?: Record<string, any> | undefined;
}, {
    type?: "SOCIAL_LINKS" | "IMAGE" | "HEADING_1" | "HEADING_2" | "HEADING_3" | "TEXT" | "PRODUCTS" | "LINK" | "DIVIDER" | undefined;
    order?: number | undefined;
    content?: string | null | undefined;
    imageUrl?: string | null | undefined;
    linkUrl?: string | null | undefined;
    settings?: Record<string, any> | undefined;
}>;
export type UpdateElementDto = z.infer<typeof updateElementSchema>;
export declare const bulkUpdateElementsSchema: z.ZodObject<{
    elements: z.ZodArray<z.ZodObject<{
        type: z.ZodNativeEnum<{
            SOCIAL_LINKS: "SOCIAL_LINKS";
            IMAGE: "IMAGE";
            HEADING_1: "HEADING_1";
            HEADING_2: "HEADING_2";
            HEADING_3: "HEADING_3";
            TEXT: "TEXT";
            PRODUCTS: "PRODUCTS";
            LINK: "LINK";
            DIVIDER: "DIVIDER";
        }>;
        order: z.ZodNumber;
        content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        linkUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    } & {
        id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "SOCIAL_LINKS" | "IMAGE" | "HEADING_1" | "HEADING_2" | "HEADING_3" | "TEXT" | "PRODUCTS" | "LINK" | "DIVIDER";
        order: number;
        id?: string | undefined;
        content?: string | null | undefined;
        imageUrl?: string | null | undefined;
        linkUrl?: string | null | undefined;
        settings?: Record<string, any> | undefined;
    }, {
        type: "SOCIAL_LINKS" | "IMAGE" | "HEADING_1" | "HEADING_2" | "HEADING_3" | "TEXT" | "PRODUCTS" | "LINK" | "DIVIDER";
        order: number;
        id?: string | undefined;
        content?: string | null | undefined;
        imageUrl?: string | null | undefined;
        linkUrl?: string | null | undefined;
        settings?: Record<string, any> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    elements: {
        type: "SOCIAL_LINKS" | "IMAGE" | "HEADING_1" | "HEADING_2" | "HEADING_3" | "TEXT" | "PRODUCTS" | "LINK" | "DIVIDER";
        order: number;
        id?: string | undefined;
        content?: string | null | undefined;
        imageUrl?: string | null | undefined;
        linkUrl?: string | null | undefined;
        settings?: Record<string, any> | undefined;
    }[];
}, {
    elements: {
        type: "SOCIAL_LINKS" | "IMAGE" | "HEADING_1" | "HEADING_2" | "HEADING_3" | "TEXT" | "PRODUCTS" | "LINK" | "DIVIDER";
        order: number;
        id?: string | undefined;
        content?: string | null | undefined;
        imageUrl?: string | null | undefined;
        linkUrl?: string | null | undefined;
        settings?: Record<string, any> | undefined;
    }[];
}>;
export type BulkUpdateElementsDto = z.infer<typeof bulkUpdateElementsSchema>;
export declare const reorderElementsSchema: z.ZodObject<{
    elementIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    elementIds: string[];
}, {
    elementIds: string[];
}>;
export type ReorderElementsDto = z.infer<typeof reorderElementsSchema>;
export declare const updateLandingPageSchema: z.ZodObject<{
    isPublished: z.ZodOptional<z.ZodBoolean>;
    themeColor: z.ZodOptional<z.ZodString>;
    metaTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    metaDescription: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    isPublished?: boolean | undefined;
    themeColor?: string | undefined;
    metaTitle?: string | null | undefined;
    metaDescription?: string | null | undefined;
}, {
    isPublished?: boolean | undefined;
    themeColor?: string | undefined;
    metaTitle?: string | null | undefined;
    metaDescription?: string | null | undefined;
}>;
export type UpdateLandingPageDto = z.infer<typeof updateLandingPageSchema>;
export declare const createLandingPageSchema: z.ZodObject<{
    themeColor: z.ZodOptional<z.ZodString>;
    metaTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    metaDescription: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    themeColor?: string | undefined;
    metaTitle?: string | null | undefined;
    metaDescription?: string | null | undefined;
}, {
    themeColor?: string | undefined;
    metaTitle?: string | null | undefined;
    metaDescription?: string | null | undefined;
}>;
export type CreateLandingPageDto = z.infer<typeof createLandingPageSchema>;
export declare const updatePageSlugSchema: z.ZodObject<{
    pageSlug: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    pageSlug?: string | null | undefined;
}, {
    pageSlug?: string | null | undefined;
}>;
export type UpdatePageSlugDto = z.infer<typeof updatePageSlugSchema>;
