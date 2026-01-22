import { Injectable } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

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

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      organization: {
        id: product.organization.id,
        name: product.organization.name,
        slug: product.organization.slug,
      },
      plans: product.plans,
      channels: product.channels.map((pc) => ({
        id: pc.channel.id,
        title: pc.channel.title,
        provider: pc.channel.provider,
      })),
    };
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
      },
    });

    if (!organization || !organization.saasActive || !organization.stripeAccountId) {
      return null;
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
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

    if (!organization || !organization.saasActive || !organization.stripeAccountId) {
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
