import type { PaymentEvent } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreatePaymentEventDto } from './payment-events.schema';
export declare class PaymentEventsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId?: string): Promise<PaymentEvent[]>;
    findOne(id: string): Promise<PaymentEvent>;
    create(data: CreatePaymentEventDto): Promise<PaymentEvent>;
}
