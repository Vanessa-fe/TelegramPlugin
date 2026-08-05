import type { CreateLandingPageDto, UpdateLandingPageDto, CreateElementDto, UpdateElementDto, BulkUpdateElementsDto, ReorderElementsDto, UpdateSocialLinksDto, UpdatePageSlugDto } from './landing-pages.schema';
import { LandingPagesService } from './landing-pages.service';
import type { AuthUser } from '../auth/auth.types';
export declare class LandingPagesController {
    private readonly landingPagesService;
    constructor(landingPagesService: LandingPagesService);
    getMyLandingPage(user: AuthUser): Promise<({
        organization: {
            id: string;
            slug: string;
            name: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }) | null>;
    getMyPageSlug(user: AuthUser): Promise<{
        slug: string;
        pageSlug: string | null;
    } | null>;
    updatePageSlug(user: AuthUser, body: UpdatePageSlugDto): Promise<{
        slug: string;
        pageSlug: string | null;
    }>;
    createLandingPage(user: AuthUser, body: CreateLandingPageDto): Promise<{
        organization: {
            id: string;
            slug: string;
            name: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }>;
    updateLandingPage(user: AuthUser, body: UpdateLandingPageDto): Promise<{
        organization: {
            id: string;
            slug: string;
            name: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }>;
    publishLandingPage(user: AuthUser): Promise<{
        organization: {
            id: string;
            slug: string;
            name: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }>;
    unpublishLandingPage(user: AuthUser): Promise<{
        organization: {
            id: string;
            slug: string;
            name: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }>;
    bulkUpdateElements(user: AuthUser, body: BulkUpdateElementsDto): Promise<({
        organization: {
            id: string;
            slug: string;
            name: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }) | null>;
    addElement(user: AuthUser, body: CreateElementDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.LandingPageElementType;
        order: number;
        content: string | null;
        imageUrl: string | null;
        linkUrl: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        landingPageId: string;
    }>;
    updateElement(user: AuthUser, id: string, body: UpdateElementDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.LandingPageElementType;
        order: number;
        content: string | null;
        imageUrl: string | null;
        linkUrl: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        landingPageId: string;
    }>;
    deleteElement(user: AuthUser, id: string): Promise<{
        success: boolean;
    }>;
    reorderElements(user: AuthUser, body: ReorderElementsDto): Promise<({
        organization: {
            id: string;
            slug: string;
            name: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }) | null>;
    updateSocialLinks(user: AuthUser, body: UpdateSocialLinksDto): Promise<({
        organization: {
            id: string;
            slug: string;
            name: string;
        };
        elements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LandingPageElementType;
            order: number;
            content: string | null;
            imageUrl: string | null;
            linkUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            landingPageId: string;
        }[];
        socialLinks: {
            id: string;
            url: string;
            platform: import("@prisma/client").$Enums.SocialPlatform;
            order: number;
            landingPageId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isPublished: boolean;
        themeColor: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }) | null>;
}
