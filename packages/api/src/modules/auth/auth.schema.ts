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
  // organizationId removed: public registration MUST create a new organization
  // to prevent privilege escalation attacks
  currency: z
    .string()
    .length(3)
    .regex(/^[A-Za-z]{3}$/, 'Le code devise doit être au format ISO 4217')
    .transform((value) => value.toUpperCase())
    .optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Email invalide').optional(),
  currentPassword: z.string().min(1).optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: passwordSchema,
});

export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token invalide'),
  newPassword: passwordSchema,
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token invalide'),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().email('Email invalide'),
});

export type ResendVerificationDto = z.infer<typeof resendVerificationSchema>;
