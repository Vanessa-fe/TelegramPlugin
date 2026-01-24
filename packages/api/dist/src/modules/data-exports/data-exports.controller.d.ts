import type { AuthUser } from '../auth/auth.types';
import { DataExportsService } from './data-exports.service';
import { type CreateDataExportDto } from './data-exports.schema';
export declare class DataExportsController {
    private readonly dataExportsService;
    constructor(dataExportsService: DataExportsService);
    requestExport(user: AuthUser, body: CreateDataExportDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        status: import("@prisma/client").$Enums.DataExportStatus;
        startedAt: Date | null;
        requestedAt: Date;
        completedAt: Date | null;
        slaDueAt: Date;
        slaMet: boolean | null;
        archivePath: string | null;
        errorMessage: string | null;
        requestedById: string | null;
    }>;
    findAll(user: AuthUser, organizationId?: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        status: import("@prisma/client").$Enums.DataExportStatus;
        startedAt: Date | null;
        requestedAt: Date;
        completedAt: Date | null;
        slaDueAt: Date;
        slaMet: boolean | null;
        archivePath: string | null;
        errorMessage: string | null;
        requestedById: string | null;
    }[]>;
    findOne(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        status: import("@prisma/client").$Enums.DataExportStatus;
        startedAt: Date | null;
        requestedAt: Date;
        completedAt: Date | null;
        slaDueAt: Date;
        slaMet: boolean | null;
        archivePath: string | null;
        errorMessage: string | null;
        requestedById: string | null;
    }>;
}
