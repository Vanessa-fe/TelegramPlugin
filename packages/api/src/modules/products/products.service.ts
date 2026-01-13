import { Injectable } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import type { Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateProductDto, UpdateProductDto } from './products.schema';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateProductDto): Promise<Product> {
    const payload: Prisma.ProductCreateInput = {
      name: data.name.trim(),
      description: data.description,
      status: data.status ?? ProductStatus.DRAFT,
      metadata: data.metadata,
      organization: {
        connect: { id: data.organizationId },
      },
    };

    return this.prisma.product.create({ data: payload });
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
