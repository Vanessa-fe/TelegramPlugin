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
    private generateUniqueSlug;
    findAll(organizationId?: string): Promise<SubscriptionWithRelations[]>;
    findOne(id: string): Promise<SubscriptionWithRelations>;
    findBySlug(organizationId: string, slug: string): Promise<SubscriptionWithRelations | null>;
    create(data: CreateSubscriptionDto): Promise<Subscription>;
    backfillSlugs(): Promise<number>;
    update(id: string, data: UpdateSubscriptionDto): Promise<Subscription>;
}
export {};
