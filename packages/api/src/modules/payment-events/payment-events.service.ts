import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PaymentEvent } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreatePaymentEventDto } from './payment-events.schema';

@Injectable()
export class PaymentEventsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId?: string): Promise<PaymentEvent[]> {
    return this.prisma.paymentEvent.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { occurredAt: 'desc' },
    });
  }

  findOne(id: string): Promise<PaymentEvent> {
    return this.prisma.paymentEvent.findUniqueOrThrow({ where: { id } });
  }

  create(data: CreatePaymentEventDto): Promise<PaymentEvent> {
    const payload: Prisma.PaymentEventUncheckedCreateInput = {
      organizationId: data.organizationId,
      subscriptionId: data.subscriptionId,
      provider: data.provider,
      type: data.type,
      externalId: data.externalId,
      payload: data.payload,
      occurredAt: data.occurredAt,
    };

    return this.prisma.paymentEvent.create({ data: payload });
  }
}
