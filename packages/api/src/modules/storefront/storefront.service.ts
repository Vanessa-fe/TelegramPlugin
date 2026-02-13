import { Injectable } from '@nestjs/common';
import { PlatformSubscriptionStatus, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 60);
}

function toRecord(
  value: unknown,
): Record<string, unknown> | null {
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
  const rawLogoUrl = typeof branding?.logoUrl === 'string' ? branding.logoUrl : '';
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
export class StorefrontService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
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
        },
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
    });

    if (!product) {
      return null;
    }

    // Only return active products from active organizations
    if (
      product.status !== ProductStatus.ACTIVE ||
      !product.organization.saasActive ||
      !product.organization.stripeAccountId
    ) {
      return null;
    }

    const branding = resolvePublicBranding(
      product.organization.metadata,
      product.organization.platformSubscription?.status,
      product.organization.platformSubscription?.platformPlan?.name,
    );

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      organization: {
        id: product.organization.id,
        name: product.organization.name,
        slug: product.organization.slug,
        branding,
      },
      plans: product.plans,
      channels: product.channels.map((pc) => ({
        id: pc.channel.id,
        title: pc.channel.title,
        provider: pc.channel.provider,
      })),
    };
  }

  async getPublicProductBySlug(organizationSlug: string, productSlug: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug: organizationSlug },
      select: {
        id: true,
        saasActive: true,
        stripeAccountId: true,
      },
    });

    if (!organization) {
      return null;
    }

    const products = await this.prisma.product.findMany({
      where: { organizationId: organization.id, status: ProductStatus.ACTIVE },
      select: { id: true, name: true },
    });

    const normalizedSlug = slugify(productSlug);
    const matchedProduct = products.find(
      (product) => slugify(product.name) === normalizedSlug,
    );

    if (!matchedProduct) {
      return null;
    }

    return this.getPublicProduct(matchedProduct.id);
  }

  async getPublicOrganization(slug: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
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

    if (
      !organization ||
      !organization.saasActive ||
      !organization.stripeAccountId
    ) {
      return null;
    }

    const branding = resolvePublicBranding(
      organization.metadata,
      organization.platformSubscription?.status,
      organization.platformSubscription?.platformPlan?.name,
    );

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      branding,
    };
  }

  async getPublicProductsByOrganization(slug: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        saasActive: true,
        stripeAccountId: true,
      },
    });

    if (
      !organization ||
      !organization.saasActive ||
      !organization.stripeAccountId
    ) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: {
        organizationId: organization.id,
        status: ProductStatus.ACTIVE,
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      plans: product.plans,
    }));
  }
}
