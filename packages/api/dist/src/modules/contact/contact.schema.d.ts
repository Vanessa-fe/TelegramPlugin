import { z } from 'zod';
export declare const contactSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    subject: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    message: string;
    subject: string;
}, {
    name: string;
    email: string;
    message: string;
    subject: string;
}>;
export type ContactDto = z.infer<typeof contactSchema>;
