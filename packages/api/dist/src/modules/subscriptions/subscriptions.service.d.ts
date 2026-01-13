import { Prisma } from '@prisma/client';
import type { Subscription } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateSubscriptionDto, UpdateSubscriptionDto } from './subscriptions.schema';
type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
    include: {
        customer: true;
        plan: true;
        channelAccesses: true;
    };
}>;
export declare class SubscriptionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId?: string): Promise<SubscriptionWithRelations[]>;
    findOne(id: string): Promise<SubscriptionWithRelations>;
    create(data: CreateSubscriptionDto): Promise<Subscription>;
    update(id: string, data: UpdateSubscriptionDto): Promise<Subscription>;
}
export {};
