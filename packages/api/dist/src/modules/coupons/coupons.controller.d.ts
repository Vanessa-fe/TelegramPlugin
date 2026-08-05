import type { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './coupons.schema';
import { CouponsService } from './coupons.service';
import type { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
export declare class CouponsController {
    private readonly couponsService;
    private readonly prisma;
    constructor(couponsService: CouponsService, prisma: PrismaService);
    findAll(user: AuthUser, organizationId?: string): Promise<import("./coupons.service").CouponWithUsageStats[]>;
    findOne(user: AuthUser, id: string): Promise<import("./coupons.service").CouponWithUsageStats>;
    getUsages(user: AuthUser, id: string): Promise<({
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
    create(user: AuthUser, body: CreateCouponDto): Promise<{
        id: string;
        currency: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        status: import("@prisma/client").$Enums.CouponStatus;
        type: import("@prisma/client").$Enums.CouponType;
        code: string;
        expiresAt: Date | null;
        discountValue: number;
        maxUses: number | null;
        usedCount: number;
        planIds: string[];
    }>;
    update(user: AuthUser, id: string, body: UpdateCouponDto): Promise<{
        id: string;
        currency: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        status: import("@prisma/client").$Enums.CouponStatus;
        type: import("@prisma/client").$Enums.CouponType;
        code: string;
        expiresAt: Date | null;
        discountValue: number;
        maxUses: number | null;
        usedCount: number;
        planIds: string[];
    }>;
    disable(user: AuthUser, id: string): Promise<{
        id: string;
        currency: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        status: import("@prisma/client").$Enums.CouponStatus;
        type: import("@prisma/client").$Enums.CouponType;
        code: string;
        expiresAt: Date | null;
        discountValue: number;
        maxUses: number | null;
        usedCount: number;
        planIds: string[];
    }>;
    validate(body: ValidateCouponDto): Promise<import("./coupons.service").ValidateCouponResult>;
}
