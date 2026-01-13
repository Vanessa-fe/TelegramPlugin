import type { CreateOrganizationDto, UpdateOrganizationDto } from './organizations.schema';
import { OrganizationsService } from './organizations.service';
import type { AuthUser } from '../auth/auth.types';
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    findAll(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        slug: string;
        stripeAccountId: string | null;
        billingEmail: string;
        timezone: string | null;
    }[]>;
    findOne(user: AuthUser, id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        slug: string;
        stripeAccountId: string | null;
        billingEmail: string;
        timezone: string | null;
    }>;
    create(body: CreateOrganizationDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        slug: string;
        stripeAccountId: string | null;
        billingEmail: string;
        timezone: string | null;
    }>;
    update(user: AuthUser, id: string, body: UpdateOrganizationDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        slug: string;
        stripeAccountId: string | null;
        billingEmail: string;
        timezone: string | null;
    }>;
}
