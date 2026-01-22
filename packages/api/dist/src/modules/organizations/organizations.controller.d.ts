import type { CreateOrganizationDto, UpdateOrganizationDto } from './organizations.schema';
import { OrganizationsService } from './organizations.service';
import type { AuthUser } from '../auth/auth.types';
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        billingEmail: string;
        stripeAccountId: string | null;
        saasActive: boolean;
        timezone: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    findOne(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        billingEmail: string;
        stripeAccountId: string | null;
        saasActive: boolean;
        timezone: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    create(body: CreateOrganizationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        billingEmail: string;
        stripeAccountId: string | null;
        saasActive: boolean;
        timezone: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(user: AuthUser, id: string, body: UpdateOrganizationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        billingEmail: string;
        stripeAccountId: string | null;
        saasActive: boolean;
        timezone: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
