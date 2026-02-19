import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LandingPageElementType,
  PlatformSubscriptionStatus,
  Prisma,
} from '@prisma/client';
import type {
  CreateLandingPageDto,
  UpdateLandingPageDto,
  CreateElementDto,
  UpdateElementDto,
  BulkUpdateElementsDto,
  ReorderElementsDto,
  UpdateSocialLinksDto,
  UpdatePageSlugDto,
} from './landing-pages.schema';

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function resolvePublicBranding(
  metadata: unknown,
  status?: PlatformSubscriptionStatus | null,
  planName?: string | null,
) {
  const metadataRecord = toRecord(metadata);
  const branding = toRecord(metadataRecord?.branding);
  const rawLogoUrl =
    typeof branding?.logoUrl === 'string' ? branding.logoUrl : '';
  const logoUrl = rawLogoUrl.trim().length > 0 ? rawLogoUrl.trim() : null;
  const requestedHide = branding?.hideSublynkBranding === true;
  const proBrandingEnabled =
    (status === PlatformSubscriptionStatus.ACTIVE ||
      status === PlatformSubscriptionStatus.TRIALING) &&
    planName === 'pro';

  return {
    logoUrl,
    hideSublynkBranding: requestedHide && proBrandingEnabled,
  };
}

@Injectable()
export class LandingPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrganization(organizationId: string) {
    const landingPage = await this.prisma.landingPage.findUnique({
      where: { organizationId },
      include: {
        elements: {
          orderBy: { order: 'asc' },
        },
        socialLinks: {
          orderBy: { order: 'asc' },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return landingPage;
  }

  async getOrganizationSlug(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { slug: true, pageSlug: true },
    });
    return organization;
  }

  async updatePageSlug(organizationId: string, dto: UpdatePageSlugDto) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { pageSlug: dto.pageSlug ?? null },
      select: { slug: true, pageSlug: true },
    });
  }

  async create(organizationId: string, dto: CreateLandingPageDto) {
    const existing = await this.prisma.landingPage.findUnique({
      where: { organizationId },
    });

    if (existing) {
      throw new ConflictException(
        'Landing page already exists for this organization',
      );
    }

    // Get organization name for default heading
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    // Create landing page with default elements
    const landingPage = await this.prisma.landingPage.create({
      data: {
        organizationId,
        themeColor: dto.themeColor ?? '#7c3aed',
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        elements: {
          create: [
            {
              type: LandingPageElementType.IMAGE,
              order: 0,
              content: null,
              imageUrl: null,
            },
            {
              type: LandingPageElementType.HEADING_1,
              order: 1,
              content: organization?.name ?? 'Mon espace',
            },
            {
              type: LandingPageElementType.TEXT,
              order: 2,
              content: 'Bienvenue ! Découvrez mes offres exclusives.',
            },
            {
              type: LandingPageElementType.HEADING_3,
              order: 3,
              content: 'Mes offres',
            },
            {
              type: LandingPageElementType.PRODUCTS,
              order: 4,
            },
          ],
        },
      },
      include: {
        elements: {
          orderBy: { order: 'asc' },
        },
        socialLinks: {
          orderBy: { order: 'asc' },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return landingPage;
  }

  async update(organizationId: string, dto: UpdateLandingPageDto) {
    const landingPage = await this.prisma.landingPage.findUnique({
      where: { organizationId },
    });

    if (!landingPage) {
      throw new NotFoundException('Landing page not found');
    }

    return this.prisma.landingPage.update({
      where: { organizationId },
      data: dto,
      include: {
        elements: {
          orderBy: { order: 'asc' },
        },
        socialLinks: {
          orderBy: { order: 'asc' },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async publish(organizationId: string) {
    return this.update(organizationId, { isPublished: true });
  }

  async unpublish(organizationId: string) {
    return this.update(organizationId, { isPublished: false });
  }

  // Element CRUD
  async addElement(organizationId: string, dto: CreateElementDto) {
    const landingPage = await this.prisma.landingPage.findUnique({
      where: { organizationId },
    });

    if (!landingPage) {
      throw new NotFoundException('Landing page not found');
    }

    return this.prisma.landingPageElement.create({
      data: {
        landingPageId: landingPage.id,
        type: dto.type,
        order: dto.order,
        content: dto.content ?? null,
        imageUrl: dto.imageUrl ?? null,
        linkUrl: dto.linkUrl ?? null,
        settings: dto.settings ?? Prisma.JsonNull,
      },
    });
  }

  async updateElement(
    organizationId: string,
    elementId: string,
    dto: UpdateElementDto,
  ) {
    const landingPage = await this.prisma.landingPage.findUnique({
      where: { organizationId },
    });

    if (!landingPage) {
      throw new NotFoundException('Landing page not found');
    }

    const element = await this.prisma.landingPageElement.findFirst({
      where: {
        id: elementId,
        landingPageId: landingPage.id,
      },
    });

    if (!element) {
      throw new NotFoundException('Element not found');
    }

    return this.prisma.landingPageElement.update({
      where: { id: elementId },
      data: dto,
    });
  }

  async deleteElement(organizationId: string, elementId: string) {
    const landingPage = await this.prisma.landingPage.findUnique({
      where: { organizationId },
    });

    if (!landingPage) {
      throw new NotFoundException('Landing page not found');
    }

    const element = await this.prisma.landingPageElement.findFirst({
      where: {
        id: elementId,
        landingPageId: landingPage.id,
      },
    });

    if (!element) {
      throw new NotFoundException('Element not found');
    }

    await this.prisma.landingPageElement.delete({
      where: { id: elementId },
    });

    return { success: true };
  }

  async bulkUpdateElements(organizationId: string, dto: BulkUpdateElementsDto) {
    const landingPage = await this.prisma.landingPage.findUnique({
      where: { organizationId },
    });

    if (!landingPage) {
      throw new NotFoundException('Landing page not found');
    }

    // Delete all existing elements and create new ones
    await this.prisma.$transaction(async (tx) => {
      await tx.landingPageElement.deleteMany({
        where: { landingPageId: landingPage.id },
      });

      await tx.landingPageElement.createMany({
        data: dto.elements.map((el, index) => ({
          landingPageId: landingPage.id,
          type: el.type,
          order: el.order ?? index,
          content: el.content ?? null,
          imageUrl: el.imageUrl ?? null,
          linkUrl: el.linkUrl ?? null,
          settings: el.settings ?? Prisma.JsonNull,
        })),
      });
    });

    return this.findByOrganization(organizationId);
  }

  async reorderElements(organizationId: string, dto: ReorderElementsDto) {
    const landingPage = await this.prisma.landingPage.findUnique({
      where: { organizationId },
    });

    if (!landingPage) {
      throw new NotFoundException('Landing page not found');
    }

    // Update order for each element
    await this.prisma.$transaction(
      dto.elementIds.map((id, index) =>
        this.prisma.landingPageElement.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return this.findByOrganization(organizationId);
  }

  // Social Links
  async updateSocialLinks(organizationId: string, dto: UpdateSocialLinksDto) {
    const landingPage = await this.prisma.landingPage.findUnique({
      where: { organizationId },
    });

    if (!landingPage) {
      throw new NotFoundException('Landing page not found');
    }

    // Delete all existing social links and create new ones
    await this.prisma.$transaction(async (tx) => {
      await tx.socialLink.deleteMany({
        where: { landingPageId: landingPage.id },
      });

      if (dto.socialLinks.length > 0) {
        await tx.socialLink.createMany({
          data: dto.socialLinks.map((link) => ({
            landingPageId: landingPage.id,
            platform: link.platform,
            url: link.url,
            order: link.order,
          })),
        });
      }
    });

    return this.findByOrganization(organizationId);
  }

  // Public storefront method
  async getPublicPage(creatorSlug: string, pageSlug?: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug: creatorSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        pageSlug: true,
        saasActive: true,
        stripeAccountId: true,
        metadata: true,
        platformSubscription: {
          select: {
            status: true,
            platformPlan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return null;
    }

    if (pageSlug && organization.pageSlug !== pageSlug) {
      return null;
    }

    const landingPage = await this.prisma.landingPage.findUnique({
      where: { organizationId: organization.id },
      include: {
        elements: {
          orderBy: { order: 'asc' },
        },
        socialLinks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!landingPage) {
      return null;
    }

    const branding = resolvePublicBranding(
      organization.metadata,
      organization.platformSubscription?.status,
      organization.platformSubscription?.platformPlan?.name,
    );

    // Get products for the organization
    const products = await this.prisma.product.findMany({
      where: {
        organizationId: organization.id,
        status: 'ACTIVE',
      },
      include: {
        plans: {
          where: { isActive: true },
          orderBy: { priceCents: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            interval: true,
            priceCents: true,
            currency: true,
            trialPeriodDays: true,
            accessDurationDays: true,
          },
        },
        channels: {
          include: {
            channel: {
              select: {
                id: true,
                title: true,
                provider: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        pageSlug: organization.pageSlug,
        branding,
      },
      landingPage: {
        id: landingPage.id,
        themeColor: landingPage.themeColor,
        metaTitle: landingPage.metaTitle,
        metaDescription: landingPage.metaDescription,
        elements: landingPage.elements,
        socialLinks: landingPage.socialLinks,
      },
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        plans: product.plans,
        channels: product.channels.map((pc) => ({
          id: pc.channel.id,
          title: pc.channel.title,
          provider: pc.channel.provider,
        })),
      })),
    };
  }
}
