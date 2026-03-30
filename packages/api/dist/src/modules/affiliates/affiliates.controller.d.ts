import type { CreateAffiliateDto, CreatePayoutDto, UpdateAffiliateDto, UpdatePayoutDto, ValidateAffiliateDto } from './affiliates.schema';
import { AffiliatesService } from './affiliates.service';
import type { AuthUser } from '../auth/auth.types';
export declare class AffiliatesController {
    private readonly affiliatesService;
    constructor(affiliatesService: AffiliatesService);
    findAll(user: AuthUser, organizationId?: string): Promise<import("./affiliates.service").AffiliateWithStats[]>;
    findOne(user: AuthUser, id: string): Promise<import("./affiliates.service").AffiliateWithStats>;
    getReferrals(user: AuthUser, id: string): Promise<{
        id: string;
        currency: string;
        createdAt: Date;
        customerId: string;
        subscriptionId: string;
        affiliateId: string;
        amountCents: number;
        commissionCents: number;
        isPaid: boolean;
    }[]>;
    getPayouts(user: AuthUser, id: string): Promise<{
        id: string;
        currency: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.PayoutStatus;
        processedAt: Date | null;
        notes: string | null;
        method: string | null;
        affiliateId: string;
        amountCents: number;
    }[]>;
    create(user: AuthUser, body: CreateAffiliateDto): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AffiliateStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        organizationId: string;
        email: string;
        referralCode: string;
        commissionRate: number;
        totalEarnings: number;
        pendingEarnings: number;
        paidEarnings: number;
    }>;
    update(user: AuthUser, id: string, body: UpdateAffiliateDto): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AffiliateStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        organizationId: string;
        email: string;
        referralCode: string;
        commissionRate: number;
        totalEarnings: number;
        pendingEarnings: number;
        paidEarnings: number;
    }>;
    deactivate(user: AuthUser, id: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AffiliateStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        organizationId: string;
        email: string;
        referralCode: string;
        commissionRate: number;
        totalEarnings: number;
        pendingEarnings: number;
        paidEarnings: number;
    }>;
    createPayout(user: AuthUser, id: string, body: CreatePayoutDto): Promise<{
        id: string;
        currency: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.PayoutStatus;
        processedAt: Date | null;
        notes: string | null;
        method: string | null;
        affiliateId: string;
        amountCents: number;
    }>;
    updatePayout(user: AuthUser, payoutId: string, body: UpdatePayoutDto): Promise<{
        id: string;
        currency: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.PayoutStatus;
        processedAt: Date | null;
        notes: string | null;
        method: string | null;
        affiliateId: string;
        amountCents: number;
    }>;
    validate(body: ValidateAffiliateDto): Promise<import("./affiliates.service").ValidateAffiliateResult>;
}
