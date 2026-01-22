import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Organization } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './organizations.schema';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateOrganizationDto): Promise<Organization> {
    const payload: Prisma.OrganizationCreateInput = {
      name: data.name,
      slug: data.slug,
      billingEmail: data.billingEmail,
      saasActive: data.saasActive ?? false,
      timezone: data.timezone ?? 'UTC',
      metadata: data.metadata,
    };

    return this.prisma.organization.create({ data: payload });
  }

  findAll(): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, data: UpdateOrganizationDto): Promise<Organization> {
    const update: Prisma.OrganizationUpdateInput = {
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug }),
      ...(data.billingEmail && { billingEmail: data.billingEmail }),
      ...(data.saasActive !== undefined && { saasActive: data.saasActive }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
    };

    try {
      return await this.prisma.organization.update({
        where: { id },
        data: update,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Organization not found');
      }

      throw error;
    }
  }
}
