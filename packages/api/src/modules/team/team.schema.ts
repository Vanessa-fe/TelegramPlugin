import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { passwordSchema } from '../auth/auth.schema';

export const manageableUserRoleSchema = z.enum([
  UserRole.ORG_ADMIN,
  UserRole.SUPPORT,
  UserRole.VIEWER,
]);

export type ManageableUserRole = z.infer<typeof manageableUserRoleSchema>;

export const createTeamInviteSchema = z.object({
  organizationId: z.string().uuid().optional(),
  email: z
    .string()
    .email('Email invalide')
    .transform((value) => value.trim().toLowerCase()),
  role: manageableUserRoleSchema.default(UserRole.SUPPORT),
});

export type CreateTeamInviteDto = z.infer<typeof createTeamInviteSchema>;

export const updateTeamMemberRoleSchema = z.object({
  role: manageableUserRoleSchema,
});

export type UpdateTeamMemberRoleDto = z.infer<typeof updateTeamMemberRoleSchema>;

export const acceptTeamInviteSchema = z.object({
  token: z.string().min(16, 'Invitation invalide'),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  password: passwordSchema.optional(),
});

export type AcceptTeamInviteDto = z.infer<typeof acceptTeamInviteSchema>;
