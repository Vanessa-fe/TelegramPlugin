import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import type { Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VipInvitationsService } from '../vip-invitations/vip-invitations.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { upsertBrevoContact } from '../../common/brevo-sync';
import type { CreateProductDto, UpdateProductDto } from './products.schema';

export type ProductWithChannels = Product & { channelIds: string[] };

const withChannelIds = {
  channels: { select: { channelId: true } },
} satisfies Prisma.ProductInclude;

type ProductWithLinks = Prisma.ProductGetPayload<{
  include: typeof withChannelIds;
}>;

function toProductWithChannels({
  channels,
  ...product
}: ProductWithLinks): ProductWithChannels {
  return { ...product, channelIds: channels.map((link) => link.channelId) };
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vipInvitationsService: VipInvitationsService,
    private readonly channelAccessService: ChannelAccessService,
  ) {}

  async create(data: CreateProductDto): Promise<ProductWithChannels> {
    const channelIds = await this.validateChannelIds(
      data.organizationId,
      data.channelIds,
    );

    const payload: Prisma.ProductCreateInput = {
      name: data.name.trim(),
      description: data.description,
      status: data.status ?? ProductStatus.DRAFT,
      metadata: data.metadata,
      organization: {
        connect: { id: data.organizationId },
      },
      ...(channelIds.length > 0 && {
        channels: {
          create: channelIds.map((channelId) => ({
            channel: { connect: { id: channelId } },
          })),
        },
      }),
    };

    const product = await this.prisma.product.create({
      data: payload,
      include: withChannelIds,
    });

    // Track VIP ROI: increment offersCreated for VIP invitation linked to this org
    try {
      await this.vipInvitationsService.incrementOffersCreated(
        data.organizationId,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to increment VIP offersCreated for org ${data.organizationId}: ${(error as Error).message}`,
      );
    }

    await this.syncOfferReadyToBrevo(data.organizationId);

    return toProductWithChannels(product);
  }

  async findAll(organizationId?: string): Promise<ProductWithChannels[]> {
    const products = await this.prisma.product.findMany({
      where: organizationId ? { organizationId } : undefined,
      include: withChannelIds,
      orderBy: { createdAt: 'desc' },
    });
    return products.map(toProductWithChannels);
  }

  async findOne(id: string): Promise<ProductWithChannels> {
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: withChannelIds,
    });
    return toProductWithChannels(product);
  }

  async update(
    id: string,
    data: UpdateProductDto,
  ): Promise<ProductWithChannels> {
    const payload: Prisma.ProductUpdateInput = {
      ...(data.name && { name: data.name.trim() }),
      ...(data.description && { description: data.description }),
      ...(data.status && { status: data.status }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
      ...(data.organizationId && {
        organization: { connect: { id: data.organizationId } },
      }),
    };

    if (data.channelIds === undefined) {
      const product = await this.prisma.product.update({
        where: { id },
        data: payload,
        include: withChannelIds,
      });
      await this.syncOfferReadyToBrevo(product.organizationId);
      return toProductWithChannels(product);
    }

    const existing = await this.prisma.product.findUniqueOrThrow({
      where: { id },
      select: { organizationId: true },
    });
    const channelIds = await this.validateChannelIds(
      data.organizationId ?? existing.organizationId,
      data.channelIds,
    );

    const product = await this.prisma.$transaction(async (tx) => {
      await tx.productChannel.deleteMany({
        where: { productId: id, channelId: { notIn: channelIds } },
      });
      if (channelIds.length > 0) {
        await tx.productChannel.createMany({
          data: channelIds.map((channelId) => ({ productId: id, channelId })),
          skipDuplicates: true,
        });
      }
      return tx.product.update({
        where: { id },
        data: payload,
        include: withChannelIds,
      });
    });

    // Buyers who paid before a channel was attached get their access now
    if (channelIds.length > 0) {
      try {
        await this.channelAccessService.grantMissingAccesses({ productId: id });
      } catch (error) {
        this.logger.error(
          `Failed to grant missing accesses after linking channels to product ${id}`,
          error as Error,
        );
      }
    }

    await this.syncOfferReadyToBrevo(product.organizationId);

    return toProductWithChannels(product);
  }

  /**
   * Brevo attribute OFFRE_PRETE: the creator has at least one active offer
   * linked to an active channel, i.e. something buyers can actually pay for.
   * Lets Brevo automations nudge creators stuck before their first sale.
   */
  private async syncOfferReadyToBrevo(organizationId: string): Promise<void> {
    try {
      const [organization, readyOffers] = await Promise.all([
        this.prisma.organization.findUnique({
          where: { id: organizationId },
          select: { billingEmail: true },
        }),
        this.prisma.product.count({
          where: {
            organizationId,
            status: ProductStatus.ACTIVE,
            channels: { some: { channel: { isActive: true } } },
          },
        }),
      ]);
      if (!organization?.billingEmail) {
        return;
      }

      await upsertBrevoContact(organization.billingEmail, {
        attributes: { OFFRE_PRETE: readyOffers > 0 },
      });
    } catch (error) {
      this.logger.error(
        `Failed to sync OFFRE_PRETE to Brevo for org ${organizationId}`,
        error as Error,
      );
    }
  }

  private async validateChannelIds(
    organizationId: string,
    channelIds: string[] | undefined,
  ): Promise<string[]> {
    const uniqueIds = [...new Set(channelIds ?? [])];
    if (uniqueIds.length === 0) {
      return [];
    }

    const count = await this.prisma.channel.count({
      where: { id: { in: uniqueIds }, organizationId },
    });
    if (count !== uniqueIds.length) {
      throw new BadRequestException(
        "Un des canaux sélectionnés n'appartient pas à cette organisation",
      );
    }

    return uniqueIds;
  }
}
