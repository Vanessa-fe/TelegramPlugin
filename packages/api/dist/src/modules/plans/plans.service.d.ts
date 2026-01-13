import { Prisma } from '@prisma/client';
import type { Plan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreatePlanDto, UpdatePlanDto } from './plans.schema';
type PlanWithRelations = Prisma.PlanGetPayload<{
    include: {
        product: true;
        subscriptions: true;
    };
}>;
export declare class PlansService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        productId?: string;
        organizationId?: string;
        includeInactive?: boolean;
    }): Promise<PlanWithRelations[]>;
    findOne(id: string): Promise<PlanWithRelations>;
    create(data: CreatePlanDto): Promise<Plan>;
    update(id: string, data: UpdatePlanDto): Promise<Plan>;
    getProductOrganization(productId: string): Promise<string | null>;
}
export {};
