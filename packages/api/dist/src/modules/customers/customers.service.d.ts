import { Prisma } from '@prisma/client';
import type { Customer } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './customers.schema';
type CustomerWithRelations = Prisma.CustomerGetPayload<{
    include: {
        organization: true;
        subscriptions: true;
        channelAccesses: true;
    };
}>;
export declare class CustomersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId?: string): Promise<CustomerWithRelations[]>;
    findOne(id: string): Promise<CustomerWithRelations>;
    create(data: CreateCustomerDto): Promise<Customer>;
    update(id: string, data: UpdateCustomerDto): Promise<Customer>;
}
export {};
