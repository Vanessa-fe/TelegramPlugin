import { LandingPageElementType, SocialPlatform } from '@prisma/client';
import { z } from 'zod';

// Social Link schemas
export const socialLinkSchema = z.object({
  platform: z.nativeEnum(SocialPlatform),
  url: z.string().url(),
  order: z.number().int().min(0),
});

export type SocialLinkDto = z.infer<typeof socialLinkSchema>;

export const updateSocialLinksSchema = z.object({
  socialLinks: z.array(socialLinkSchema),
});

export type UpdateSocialLinksDto = z.infer<typeof updateSocialLinksSchema>;

// Element schemas
export const elementSettingsSchema = z.record(z.any()).optional();

export const landingPageElementSchema = z.object({
  type: z.nativeEnum(LandingPageElementType),
  order: z.number().int().min(0),
  content: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  linkUrl: z.string().url().nullable().optional(),
  settings: elementSettingsSchema,
});

export type LandingPageElementDto = z.infer<typeof landingPageElementSchema>;

export const createElementSchema = landingPageElementSchema;
export type CreateElementDto = z.infer<typeof createElementSchema>;

export const updateElementSchema = landingPageElementSchema.partial();
export type UpdateElementDto = z.infer<typeof updateElementSchema>;

export const bulkUpdateElementsSchema = z.object({
  elements: z.array(
    landingPageElementSchema.extend({
      id: z.string().uuid().optional(),
    }),
  ),
});

export type BulkUpdateElementsDto = z.infer<typeof bulkUpdateElementsSchema>;

export const reorderElementsSchema = z.object({
  elementIds: z.array(z.string().uuid()),
});

export type ReorderElementsDto = z.infer<typeof reorderElementsSchema>;

// Landing page config schemas
export const updateLandingPageSchema = z.object({
  isPublished: z.boolean().optional(),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  metaTitle: z.string().max(60).nullable().optional(),
  metaDescription: z.string().max(160).nullable().optional(),
});

export type UpdateLandingPageDto = z.infer<typeof updateLandingPageSchema>;

export const createLandingPageSchema = z.object({
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  metaTitle: z.string().max(60).nullable().optional(),
  metaDescription: z.string().max(160).nullable().optional(),
});

export type CreateLandingPageDto = z.infer<typeof createLandingPageSchema>;

// Page slug schema for custom URL
export const updatePageSlugSchema = z.object({
  pageSlug: z
    .string()
    .min(3, 'Le slug doit contenir au moins 3 caractères')
    .max(30, 'Le slug ne peut pas dépasser 30 caractères')
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets',
    )
    .nullable()
    .optional(),
});

export type UpdatePageSlugDto = z.infer<typeof updatePageSlugSchema>;
