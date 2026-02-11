import type { Affiliate, AffiliatePayout, AffiliateReferral } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateAffiliateDto, CreatePayoutDto, UpdateAffiliateDto, UpdatePayoutDto, ValidateAffiliateDto } from './affiliates.schema';
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
export declare class AffiliatesService {
    private readonly prisma;
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
}
