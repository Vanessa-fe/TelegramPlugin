import { z } from 'zod';

export const createDataExportSchema = z.object({
  organizationId: z.string().uuid().optional(),
});

export type CreateDataExportDto = z.infer<typeof createDataExportSchema>;
