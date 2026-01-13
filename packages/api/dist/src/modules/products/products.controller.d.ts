import type { CreateProductDto, UpdateProductDto } from './products.schema';
import { ProductsService } from './products.service';
import type { AuthUser } from '../auth/auth.types';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(user: AuthUser, organizationId?: string): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ProductStatus;
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
    }[]>;
    findOne(user: AuthUser, id: string): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ProductStatus;
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
    }>;
    create(user: AuthUser, body: CreateProductDto): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ProductStatus;
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
    }>;
    update(user: AuthUser, id: string, body: UpdateProductDto): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ProductStatus;
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
    }>;
}
