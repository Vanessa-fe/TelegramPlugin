import type { Affiliate, AffiliateClick, AffiliatePayout, AffiliateReferral } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateAffiliateDto, CreatePayoutDto, TrackClickDto, UpdateAffiliateDto, UpdatePayoutDto, ValidateAffiliateDto } from './affiliates.schema';
export type AffiliateWithStats = Affiliate & {
    _count: {
        referrals: number;
        payouts: number;
    };
};
export type ValidateAffiliateResult = {
    valid: boolean;
    affiliate?: Affiliate;
    error?: string;
};
export type AffiliateReferralWithDetails = AffiliateReferral & {
    subscription?: {
        id: string;
        plan?: {
            name: string;
        };
        status?: string;
    };
    customer?: {
        id: string;
        email?: string | null;
        telegramUsername?: string | null;
    };
};
export type AffiliateStats = {
    totalClicks: number;
    totalConversions: number;
    pendingConversions: number;
    approvedConversions: number;
    paidConversions: number;
    cancelledConversions: number;
    totalCommissions: number;
    pendingCommissions: number;
    approvedCommissions: number;
    paidCommissions: number;
    conversionRate: number;
};
export declare class AffiliatesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(data: CreateAffiliateDto): Promise<Affiliate>;
    findAll(organizationId: string): Promise<AffiliateWithStats[]>;
    findOne(id: string): Promise<AffiliateWithStats>;
    update(id: string, data: UpdateAffiliateDto): Promise<Affiliate>;
    deactivate(id: string): Promise<Affiliate>;
    validate(data: ValidateAffiliateDto): Promise<ValidateAffiliateResult>;
    getReferrals(affiliateId: string): Promise<AffiliateReferral[]>;
    createReferral(affiliateId: string, subscriptionId: string, customerId: string, amountCents: number, currency: string): Promise<AffiliateReferral>;
    getPayouts(affiliateId: string): Promise<AffiliatePayout[]>;
    createPayout(affiliateId: string, data: CreatePayoutDto): Promise<AffiliatePayout>;
    updatePayout(payoutId: string, data: UpdatePayoutDto): Promise<AffiliatePayout>;
    trackClick(data: TrackClickDto, ipAddress?: string): Promise<AffiliateClick>;
    getAffiliateStats(affiliateId: string): Promise<AffiliateStats>;
    getOrganizationStats(organizationId: string): Promise<AffiliateStats>;
    cancelReferral(referralId: string): Promise<AffiliateReferral>;
    approveReferral(referralId: string): Promise<AffiliateReferral>;
    getRecentClicks(affiliateId: string, limit?: number): Promise<AffiliateClick[]>;
    findClickByVisitor(affiliateId: string, visitorId: string, withinDays: number): Promise<AffiliateClick | null>;
}
