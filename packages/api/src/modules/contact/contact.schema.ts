import { z } from 'zod';

// Header-like fields end up in the email subject: no line breaks.
const singleLine = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .regex(/^[^\r\n]*$/, 'Must be a single line');

export const contactSchema = z.object({
  name: singleLine(2, 120),
  email: z.string().trim().email().max(254),
  subject: singleLine(2, 160),
  message: z.string().trim().min(10).max(5000),
  // Honeypot: hidden from humans, so any value means a bot filled the form.
  website: z.string().max(500).optional(),
  // Cloudflare Turnstile token, required once TURNSTILE_SECRET_KEY is set.
  turnstileToken: z.string().max(2048).optional(),
});

export type ContactDto = z.infer<typeof contactSchema>;
