import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';
import { AuditLogService } from '../audit-log/audit-log.service';
type DeleteCustomerInput = {
    organizationId: string;
    customerId: string;
    actorId?: string | null;
    actorRole?: UserRole;
    correlationId?: string | null;
    requestId?: string | null;
    viaOrganizationDeletion?: boolean;
};
type DeleteOrganizationInput = {
    organizationId: string;
    actorId?: string | null;
    actorRole?: UserRole;
    correlationId?: string | null;
    requestId?: string | null;
};
export declare class DataDeletionsService {
    private readonly prisma;
    private readonly channelAccessService;
    private readonly auditLogService;
    private readonly logger;
    constructor(prisma: PrismaService, channelAccessService: ChannelAccessService, auditLogService: AuditLogService);
    deleteCustomer(input: DeleteCustomerInput): Promise<void>;
    deleteOrganization(input: DeleteOrganizationInput): Promise<void>;
    private buildDeletedEmail;
    private resolveCorrelationId;
    private buildMetadata;
}
export {};
