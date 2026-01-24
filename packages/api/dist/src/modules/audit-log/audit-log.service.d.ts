import { AuditActorType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export type AuditLogInput = {
    organizationId: string;
    actorId?: string | null;
    actorType?: AuditActorType;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    correlationId?: string | null;
    metadata?: Prisma.JsonValue;
};
export type SubscriptionAuditLogInput = Omit<AuditLogInput, 'organizationId'> & {
    subscriptionId: string;
};
export declare class AuditLogService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(entry: AuditLogInput): Promise<void>;
    createForSubscription(entry: SubscriptionAuditLogInput): Promise<void>;
}
