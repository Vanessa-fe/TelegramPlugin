import type { CreateProductDto, UpdateProductDto } from './products.schema';
import { ProductsService } from './products.service';
import type { AuthUser } from '../auth/auth.types';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(user: AuthUser, organizationId?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        status: import("@prisma/client").$Enums.ProductStatus;
    }[]>;
    findOne(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        status: import("@prisma/client").$Enums.ProductStatus;
    }>;
    create(user: AuthUser, body: CreateProductDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        status: import("@prisma/client").$Enums.ProductStatus;
    }>;
    update(user: AuthUser, id: string, body: UpdateProductDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        status: import("@prisma/client").$Enums.ProductStatus;
    }>;
}
