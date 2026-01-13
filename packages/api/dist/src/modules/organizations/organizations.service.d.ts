import { Organization } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './organizations.schema';
export declare class OrganizationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateOrganizationDto): Promise<Organization>;
    findAll(): Promise<Organization[]>;
    findOne(id: string): Promise<Organization>;
    update(id: string, data: UpdateOrganizationDto): Promise<Organization>;
}
