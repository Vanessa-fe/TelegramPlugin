import { z } from 'zod';

// Reusable password schema with strong validation
export const passwordSchema = z
  .string()
  .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(
    /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~;']/,
    'Le mot de passe doit contenir au moins un caractère spécial',
  );

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
  })
  .default({});

export type RefreshDto = z.infer<typeof refreshSchema>;

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: passwordSchema,
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  organizationId: z.string().uuid().optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
