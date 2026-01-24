import { z } from 'zod';
export declare const createDataExportSchema: z.ZodObject<{
    organizationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string | undefined;
}, {
    organizationId?: string | undefined;
}>;
export type CreateDataExportDto = z.infer<typeof createDataExportSchema>;
