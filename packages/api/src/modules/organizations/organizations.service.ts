import { Injectable } from '@nestjs/common';
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

  findOne(id: string): Promise<Organization> {
    return this.prisma.organization.findUniqueOrThrow({
      where: { id },
    });
  }

  update(id: string, data: UpdateOrganizationDto): Promise<Organization> {
    const update: Prisma.OrganizationUpdateInput = {
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug }),
      ...(data.billingEmail && { billingEmail: data.billingEmail }),
      ...(data.saasActive !== undefined && { saasActive: data.saasActive }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
    };

    return this.prisma.organization.update({
      where: { id },
      data: update,
    });
  }
}
