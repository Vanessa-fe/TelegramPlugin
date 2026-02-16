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
exports.CouponsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let CouponsService = class CouponsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const organizationCurrency = await this.getOrganizationCurrency(data.organizationId);
        const existing = await this.prisma.coupon.findUnique({
            where: {
                organizationId_code: {
                    organizationId: data.organizationId,
                    code: data.code,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Un coupon avec ce code existe déjà');
        }
        if (data.type === client_1.CouponType.FIXED_AMOUNT) {
            if (data.currency !== organizationCurrency) {
                throw new common_1.BadRequestException(`La devise du coupon doit correspondre à celle de l'organisation (${organizationCurrency})`);
            }
        }
        else if (data.currency) {
            throw new common_1.BadRequestException('La devise doit être vide pour un coupon en pourcentage');
        }
        const payload = {
            code: data.code,
            type: data.type,
            discountValue: data.discountValue,
            currency: data.type === client_1.CouponType.FIXED_AMOUNT ? organizationCurrency : undefined,
            maxUses: data.maxUses,
            expiresAt: data.expiresAt,
            planIds: data.planIds,
            organization: {
                connect: { id: data.organizationId },
            },
        };
        return this.prisma.coupon.create({ data: payload });
    }
    async findAll(organizationId) {
        return this.prisma.coupon.findMany({
            where: { organizationId },
            include: {
                _count: { select: { usages: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { id },
            include: {
                _count: { select: { usages: true } },
            },
        });
        if (!coupon) {
            throw new common_1.NotFoundException('Coupon introuvable');
        }
        return coupon;
    }
    async update(id, data) {
        const coupon = await this.findOne(id);
        const organizationCurrency = await this.getOrganizationCurrency(coupon.organizationId);
        if (data.code && data.code !== coupon.code) {
            const existing = await this.prisma.coupon.findUnique({
                where: {
                    organizationId_code: {
                        organizationId: coupon.organizationId,
                        code: data.code,
                    },
                },
            });
            if (existing) {
                throw new common_1.BadRequestException('Un coupon avec ce code existe déjà');
            }
        }
        if (coupon.type === client_1.CouponType.FIXED_AMOUNT && data.currency) {
            if (data.currency !== organizationCurrency) {
                throw new common_1.BadRequestException(`La devise du coupon doit correspondre à celle de l'organisation (${organizationCurrency})`);
            }
        }
        if (coupon.type === client_1.CouponType.PERCENTAGE && data.currency !== undefined) {
            throw new common_1.BadRequestException('La devise ne peut pas être modifiée pour un coupon en pourcentage');
        }
        const payload = {
            ...(data.code && { code: data.code }),
            ...(data.discountValue !== undefined && {
                discountValue: data.discountValue,
            }),
            ...(data.currency !== undefined && { currency: data.currency }),
            ...(data.status && { status: data.status }),
            ...(data.maxUses !== undefined && { maxUses: data.maxUses }),
            ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
            ...(data.planIds && { planIds: data.planIds }),
        };
        return this.prisma.coupon.update({
            where: { id },
            data: payload,
        });
    }
    async disable(id) {
        await this.findOne(id);
        return this.prisma.coupon.update({
            where: { id },
            data: { status: client_1.CouponStatus.DISABLED },
        });
    }
    async validate(data, priceCents) {
        const coupon = await this.prisma.coupon.findUnique({
            where: {
                organizationId_code: {
                    organizationId: data.organizationId,
                    code: data.code.toUpperCase(),
                },
            },
        });
        if (!coupon) {
            return { valid: false, error: 'Coupon introuvable' };
        }
        if (coupon.status !== client_1.CouponStatus.ACTIVE) {
            return { valid: false, error: 'Ce coupon est désactivé' };
        }
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
            return { valid: false, error: 'Ce coupon a expiré' };
        }
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return { valid: false, error: "Ce coupon a atteint sa limite d'utilisation" };
        }
        if (coupon.planIds.length > 0 && !coupon.planIds.includes(data.planId)) {
            return { valid: false, error: "Ce coupon n'est pas valide pour ce plan" };
        }
        let discountCents;
        let discountPercentage;
        if (coupon.type === client_1.CouponType.PERCENTAGE) {
            discountPercentage = coupon.discountValue;
            discountCents = Math.round((priceCents * coupon.discountValue) / 100);
        }
        else {
            discountCents = Math.min(coupon.discountValue, priceCents);
        }
        return {
            valid: true,
            coupon,
            discountCents,
            discountPercentage,
        };
    }
    async incrementUsage(couponId) {
        await this.prisma.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } },
        });
    }
    async getUsages(couponId) {
        return this.prisma.couponUsage.findMany({
            where: { couponId },
            include: {
                subscription: {
                    select: {
                        id: true,
                        plan: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getOrganizationCurrency(organizationId) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { currency: true },
        });
        if (!organization) {
            throw new common_1.BadRequestException('Organisation introuvable');
        }
        return organization.currency;
    }
};
exports.CouponsService = CouponsService;
exports.CouponsService = CouponsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CouponsService);
//# sourceMappingURL=coupons.service.js.map