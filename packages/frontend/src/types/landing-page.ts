export enum LandingPageElementType {
  SOCIAL_LINKS = 'SOCIAL_LINKS',
  IMAGE = 'IMAGE',
  HEADING_1 = 'HEADING_1',
  HEADING_2 = 'HEADING_2',
  HEADING_3 = 'HEADING_3',
  TEXT = 'TEXT',
  PRODUCTS = 'PRODUCTS',
  LINK = 'LINK',
  DIVIDER = 'DIVIDER',
}

export enum SocialPlatform {
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  TWITTER = 'TWITTER',
  TIKTOK = 'TIKTOK',
  TELEGRAM = 'TELEGRAM',
  DISCORD = 'DISCORD',
  LINKEDIN = 'LINKEDIN',
  WEBSITE = 'WEBSITE',
}

export interface LandingPageElement {
  id: string;
  landingPageId: string;
  type: LandingPageElementType;
  order: number;
  content?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  id: string;
  landingPageId: string;
  platform: SocialPlatform;
  url: string;
  order: number;
}

export interface LandingPage {
  id: string;
  organizationId: string;
  isPublished: boolean;
  themeColor?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  updatedAt: string;
  elements: LandingPageElement[];
  socialLinks: SocialLink[];
  organization: {
    id: string;
    name: string;
    slug: string;
    pageSlug?: string | null;
  };
}

export interface CreateLandingPageDto {
  themeColor?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface UpdateLandingPageDto {
  isPublished?: boolean;
  themeColor?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface CreateElementDto {
  type: LandingPageElementType;
  order: number;
  content?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  settings?: Record<string, unknown>;
}

export interface UpdateElementDto {
  type?: LandingPageElementType;
  order?: number;
  content?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  settings?: Record<string, unknown>;
}

export interface BulkUpdateElementsDto {
  elements: Array<CreateElementDto & { id?: string }>;
}

export interface ReorderElementsDto {
  elementIds: string[];
}

export interface SocialLinkDto {
  platform: SocialPlatform;
  url: string;
  order: number;
}

export interface UpdateSocialLinksDto {
  socialLinks: SocialLinkDto[];
}

// Public page response
export interface PublicLandingPage {
  organization: {
    id: string;
    name: string;
    slug: string;
    pageSlug?: string | null;
    branding?: {
      logoUrl: string | null;
      hideSublynkBranding: boolean;
    };
  };
  landingPage: {
    id: string;
    themeColor?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    elements: LandingPageElement[];
    socialLinks: SocialLink[];
  };
  products: Array<{
    id: string;
    name: string;
    description?: string | null;
    plans: Array<{
      id: string;
      name: string;
      description?: string | null;
      interval: string;
      priceCents: number;
      currency: string;
      trialPeriodDays?: number | null;
      accessDurationDays?: number | null;
    }>;
    channels: Array<{
      id: string;
      title?: string | null;
      provider: string;
    }>;
  }>;
}
