import type { Coupon } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './coupons.schema';
export type CouponWithUsageStats = Coupon & {
    _count: {
        usages: number;
    };
};
export type ValidateCouponResult = {
    valid: boolean;
    coupon?: Coupon;
    discountCents?: number;
    discountPercentage?: number;
    error?: string;
};
export declare class CouponsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateCouponDto): Promise<Coupon>;
    findAll(organizationId: string): Promise<CouponWithUsageStats[]>;
    findOne(id: string): Promise<CouponWithUsageStats>;
    update(id: string, data: UpdateCouponDto): Promise<Coupon>;
    disable(id: string): Promise<Coupon>;
    validate(data: ValidateCouponDto, priceCents: number): Promise<ValidateCouponResult>;
    incrementUsage(couponId: string): Promise<void>;
    getUsages(couponId: string): Promise<({
        subscription: {
            id: string;
            plan: {
                name: string;
            };
        };
    } & {
        id: string;
        createdAt: Date;
        customerId: string;
        subscriptionId: string;
        couponId: string;
        discountCents: number;
        originalCents: number;
    })[]>;
}
