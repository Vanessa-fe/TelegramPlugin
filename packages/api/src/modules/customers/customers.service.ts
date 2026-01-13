import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Customer } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
} from './customers.schema';

type CustomerWithRelations = Prisma.CustomerGetPayload<{
  include: {
    organization: true;
    subscriptions: true;
    channelAccesses: true;
  };
}>;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId?: string): Promise<CustomerWithRelations[]> {
    return this.prisma.customer.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: true,
        subscriptions: true,
        channelAccesses: true,
      },
    });
  }

  findOne(id: string): Promise<CustomerWithRelations> {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id },
      include: {
        organization: true,
        subscriptions: true,
        channelAccesses: true,
      },
    });
  }

  create(data: CreateCustomerDto): Promise<Customer> {
    const payload: Prisma.CustomerCreateInput = {
      organization: { connect: { id: data.organizationId } },
      email: data.email?.toLowerCase(),
      displayName: data.displayName,
      telegramUserId: data.telegramUserId,
      telegramUsername: data.telegramUsername?.toLowerCase(),
      externalId: data.externalId,
      metadata: data.metadata,
    };

    return this.prisma.customer.create({ data: payload });
  }

  update(id: string, data: UpdateCustomerDto): Promise<Customer> {
    const payload: Prisma.CustomerUpdateInput = {
      ...(data.organizationId && {
        organization: { connect: { id: data.organizationId } },
      }),
      ...(data.email !== undefined && { email: data.email?.toLowerCase() }),
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.telegramUserId !== undefined && {
        telegramUserId: data.telegramUserId,
      }),
      ...(data.telegramUsername !== undefined && {
        telegramUsername: data.telegramUsername?.toLowerCase(),
      }),
      ...(data.externalId !== undefined && { externalId: data.externalId }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
    };

    return this.prisma.customer.update({
      where: { id },
      data: payload,
    });
  }
}
