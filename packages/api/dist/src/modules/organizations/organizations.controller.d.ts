import type { CreateOrganizationDto, UpdateOrganizationDto } from './organizations.schema';
import { OrganizationsService } from './organizations.service';
import type { AuthUser } from '../auth/auth.types';
import { DataDeletionsService } from '../data-deletions/data-deletions.service';
export declare class OrganizationsController {
    private readonly organizationsService;
    private readonly dataDeletionsService;
    constructor(organizationsService: OrganizationsService, dataDeletionsService: DataDeletionsService);
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        billingEmail: string;
        stripeAccountId: string | null;
        saasActive: boolean;
        timezone: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        deletedAt: Date | null;
    }[]>;
    findOne(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        billingEmail: string;
        stripeAccountId: string | null;
        saasActive: boolean;
        timezone: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        deletedAt: Date | null;
    }>;
    create(body: CreateOrganizationDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        billingEmail: string;
        stripeAccountId: string | null;
        saasActive: boolean;
        timezone: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        deletedAt: Date | null;
    }>;
    update(user: AuthUser, id: string, body: UpdateOrganizationDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        billingEmail: string;
        stripeAccountId: string | null;
        saasActive: boolean;
        timezone: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        deletedAt: Date | null;
    }>;
    deleteOrganization(user: AuthUser, id: string, correlationId?: string, requestId?: string): Promise<{
        message: string;
    }>;
    deleteCustomer(user: AuthUser, orgId: string, customerId: string, correlationId?: string, requestId?: string): Promise<{
        message: string;
    }>;
}
