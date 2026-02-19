"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePageSlugSchema = exports.createLandingPageSchema = exports.updateLandingPageSchema = exports.reorderElementsSchema = exports.bulkUpdateElementsSchema = exports.updateElementSchema = exports.createElementSchema = exports.landingPageElementSchema = exports.elementSettingsSchema = exports.updateSocialLinksSchema = exports.socialLinkSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.socialLinkSchema = zod_1.z.object({
    platform: zod_1.z.nativeEnum(client_1.SocialPlatform),
    url: zod_1.z.string().url(),
    order: zod_1.z.number().int().min(0),
});
exports.updateSocialLinksSchema = zod_1.z.object({
    socialLinks: zod_1.z.array(exports.socialLinkSchema),
});
exports.elementSettingsSchema = zod_1.z.record(zod_1.z.any()).optional();
exports.landingPageElementSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(client_1.LandingPageElementType),
    order: zod_1.z.number().int().min(0),
    content: zod_1.z.string().nullable().optional(),
    imageUrl: zod_1.z.string().url().nullable().optional(),
    linkUrl: zod_1.z.string().url().nullable().optional(),
    settings: exports.elementSettingsSchema,
});
exports.createElementSchema = exports.landingPageElementSchema;
exports.updateElementSchema = exports.landingPageElementSchema.partial();
exports.bulkUpdateElementsSchema = zod_1.z.object({
    elements: zod_1.z.array(exports.landingPageElementSchema.extend({
        id: zod_1.z.string().uuid().optional(),
    })),
});
exports.reorderElementsSchema = zod_1.z.object({
    elementIds: zod_1.z.array(zod_1.z.string().uuid()),
});
exports.updateLandingPageSchema = zod_1.z.object({
    isPublished: zod_1.z.boolean().optional(),
    themeColor: zod_1.z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
    metaTitle: zod_1.z.string().max(60).nullable().optional(),
    metaDescription: zod_1.z.string().max(160).nullable().optional(),
});
exports.createLandingPageSchema = zod_1.z.object({
    themeColor: zod_1.z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
    metaTitle: zod_1.z.string().max(60).nullable().optional(),
    metaDescription: zod_1.z.string().max(160).nullable().optional(),
});
exports.updatePageSlugSchema = zod_1.z.object({
    pageSlug: zod_1.z
        .string()
        .min(3, 'Le slug doit contenir au moins 3 caractères')
        .max(30, 'Le slug ne peut pas dépasser 30 caractères')
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets')
        .nullable()
        .optional(),
});
//# sourceMappingURL=landing-pages.schema.js.map