import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import type { Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VipInvitationsService } from '../vip-invitations/vip-invitations.service';
import type { CreateProductDto, UpdateProductDto } from './products.schema';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vipInvitationsService: VipInvitationsService,
  ) {}

  async create(data: CreateProductDto): Promise<Product> {
    const payload: Prisma.ProductCreateInput = {
      name: data.name.trim(),
      description: data.description,
      status: data.status ?? ProductStatus.DRAFT,
      metadata: data.metadata,
      organization: {
        connect: { id: data.organizationId },
      },
    };

    const product = await this.prisma.product.create({ data: payload });

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

    return product;
  }

  findAll(organizationId?: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string): Promise<Product> {
    return this.prisma.product.findUniqueOrThrow({
      where: { id },
    });
  }

  update(id: string, data: UpdateProductDto): Promise<Product> {
    const payload: Prisma.ProductUpdateInput = {
      ...(data.name && { name: data.name.trim() }),
      ...(data.description && { description: data.description }),
      ...(data.status && { status: data.status }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
      ...(data.organizationId && {
        organization: { connect: { id: data.organizationId } },
      }),
    };

    return this.prisma.product.update({
      where: { id },
      data: payload,
    });
  }
}
