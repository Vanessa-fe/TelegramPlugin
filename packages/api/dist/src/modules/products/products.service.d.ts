import type { Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateProductDto, UpdateProductDto } from './products.schema';
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateProductDto): Promise<Product>;
    findAll(organizationId?: string): Promise<Product[]>;
    findOne(id: string): Promise<Product>;
    update(id: string, data: UpdateProductDto): Promise<Product>;
}
