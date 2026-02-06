import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  subject: z.string().min(2).max(160),
  message: z.string().min(10).max(5000),
});

export type ContactDto = z.infer<typeof contactSchema>;
