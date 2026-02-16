"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliatesService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const REFERRAL_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const INTERNAL_AFFILIATE_EMAIL_DOMAIN = 'sublynk.local';
function generateReferralCode() {
    const bytes = (0, node_crypto_1.randomBytes)(8);
    let code = '';
    for (const byte of bytes) {
        code += REFERRAL_CODE_ALPHABET[byte % REFERRAL_CODE_ALPHABET.length];
    }
    return code;
}
function normalizeAffiliateEmail(email) {
    if (!email)
        return undefined;
    const normalized = email.trim().toLowerCase();
    return normalized.length > 0 ? normalized : undefined;
}
function buildInternalAffiliateEmail(referralCode) {
    return `affiliate+${referralCode.toLowerCase()}@${INTERNAL_AFFILIATE_EMAIL_DOMAIN}`;
}
let AffiliatesService = class AffiliatesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        let referralCode = data.referralCode;
        if (!referralCode) {
            referralCode = generateReferralCode();
        }
        const existingByCode = await this.prisma.affiliate.findUnique({
            where: { referralCode },
        });
        if (existingByCode) {
            throw new common_1.BadRequestException('Ce code de parrainage est déjà utilisé');
        }
        const normalizedEmail = normalizeAffiliateEmail(data.email);
        const affiliateEmail = normalizedEmail ?? buildInternalAffiliateEmail(referralCode);
        const existingByEmail = await this.prisma.affiliate.findUnique({
            where: {
                organizationId_email: {
                    organizationId: data.organizationId,
                    email: affiliateEmail,
                },
            },
        });
        if (existingByEmail) {
            throw new common_1.BadRequestException('Un affilié avec cet email existe déjà');
        }
        const isLinkOnlyAffiliate = !normalizedEmail;
        const payload = {
            email: affiliateEmail,
            name: data.name,
            referralCode,
            commissionRate: data.commissionRate,
            status: data.status ??
                (isLinkOnlyAffiliate ? client_1.AffiliateStatus.ACTIVE : client_1.AffiliateStatus.PENDING),
            metadata: data.metadata,
            organization: {
                connect: { id: data.organizationId },
            },
        };
        return this.prisma.affiliate.create({ data: payload });
    }
    async findAll(organizationId) {
        return this.prisma.affiliate.findMany({
            where: { organizationId },
            include: {
                _count: { select: { referrals: true, payouts: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const affiliate = await this.prisma.affiliate.findUnique({
            where: { id },
            include: {
                _count: { select: { referrals: true, payouts: true } },
            },
        });
        if (!affiliate) {
            throw new common_1.NotFoundException('Affilié introuvable');
        }
        return affiliate;
    }
    async update(id, data) {
        const affiliate = await this.findOne(id);
        const normalizedEmail = normalizeAffiliateEmail(data.email);
        if (normalizedEmail && normalizedEmail !== affiliate.email) {
            const existing = await this.prisma.affiliate.findUnique({
                where: {
                    organizationId_email: {
                        organizationId: affiliate.organizationId,
                        email: normalizedEmail,
                    },
                },
            });
            if (existing) {
                throw new common_1.BadRequestException('Un affilié avec cet email existe déjà');
            }
        }
        if (data.referralCode && data.referralCode !== affiliate.referralCode) {
            const existing = await this.prisma.affiliate.findUnique({
                where: { referralCode: data.referralCode },
            });
            if (existing) {
                throw new common_1.BadRequestException('Ce code de parrainage est déjà utilisé');
            }
        }
        const payload = {
            ...(normalizedEmail && { email: normalizedEmail }),
            ...(data.name !== undefined && { name: data.name }),
            ...(data.referralCode && { referralCode: data.referralCode }),
            ...(data.commissionRate !== undefined && {
                commissionRate: data.commissionRate,
            }),
            ...(data.status && { status: data.status }),
            ...(data.metadata !== undefined && { metadata: data.metadata }),
        };
        return this.prisma.affiliate.update({
            where: { id },
            data: payload,
        });
    }
    async deactivate(id) {
        await this.findOne(id);
        return this.prisma.affiliate.update({
            where: { id },
            data: { status: client_1.AffiliateStatus.DEACTIVATED },
        });
    }
    async validate(data) {
        const affiliate = await this.prisma.affiliate.findUnique({
            where: { referralCode: data.code.toUpperCase() },
        });
        if (!affiliate) {
            return { valid: false, error: 'Code affilié introuvable' };
        }
        if (affiliate.organizationId !== data.organizationId) {
            return { valid: false, error: 'Code affilié introuvable' };
        }
        if (affiliate.status !== client_1.AffiliateStatus.ACTIVE) {
            return { valid: false, error: "Cet affilié n'est pas actif" };
        }
        return { valid: true, affiliate };
    }
    async getReferrals(affiliateId) {
        return this.prisma.affiliateReferral.findMany({
            where: { affiliateId },
            include: {
                subscription: {
                    select: {
                        id: true,
                        plan: { select: { name: true } },
                    },
                },
                customer: {
                    select: {
                        id: true,
                        email: true,
                        telegramUsername: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createReferral(affiliateId, subscriptionId, customerId, amountCents, currency) {
        const affiliate = await this.findOne(affiliateId);
        const commissionCents = Math.round((amountCents * affiliate.commissionRate) / 100);
        const referral = await this.prisma.affiliateReferral.create({
            data: {
                affiliateId,
                subscriptionId,
                customerId,
                amountCents,
                commissionCents,
                currency: currency.toLowerCase(),
            },
        });
        await this.prisma.affiliate.update({
            where: { id: affiliateId },
            data: {
                totalEarnings: { increment: commissionCents },
                pendingEarnings: { increment: commissionCents },
            },
        });
        return referral;
    }
    async getPayouts(affiliateId) {
        return this.prisma.affiliatePayout.findMany({
            where: { affiliateId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createPayout(affiliateId, data) {
        const affiliate = await this.findOne(affiliateId);
        if (data.amountCents > affiliate.pendingEarnings) {
            throw new common_1.BadRequestException('Le montant du paiement dépasse les gains en attente');
        }
        const payout = await this.prisma.affiliatePayout.create({
            data: {
                affiliateId,
                amountCents: data.amountCents,
                currency: data.currency,
                method: data.method,
                notes: data.notes,
            },
        });
        return payout;
    }
    async updatePayout(payoutId, data) {
        const payout = await this.prisma.affiliatePayout.findUnique({
            where: { id: payoutId },
        });
        if (!payout) {
            throw new common_1.NotFoundException('Paiement introuvable');
        }
        const previousStatus = payout.status;
        const updated = await this.prisma.affiliatePayout.update({
            where: { id: payoutId },
            data: {
                status: data.status,
                notes: data.notes,
                ...(data.status === client_1.PayoutStatus.COMPLETED && {
                    processedAt: new Date(),
                }),
            },
        });
        if (previousStatus !== client_1.PayoutStatus.COMPLETED &&
            data.status === client_1.PayoutStatus.COMPLETED) {
            await this.prisma.$transaction([
                this.prisma.affiliate.update({
                    where: { id: payout.affiliateId },
                    data: {
                        pendingEarnings: { decrement: payout.amountCents },
                        paidEarnings: { increment: payout.amountCents },
                    },
                }),
                this.prisma.affiliateReferral.updateMany({
                    where: {
                        affiliateId: payout.affiliateId,
                        isPaid: false,
                    },
                    data: { isPaid: true },
                }),
            ]);
        }
        return updated;
    }
};
exports.AffiliatesService = AffiliatesService;
exports.AffiliatesService = AffiliatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AffiliatesService);
//# sourceMappingURL=affiliates.service.js.map