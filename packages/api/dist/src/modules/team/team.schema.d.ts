import { z } from 'zod';
export declare const manageableUserRoleSchema: z.ZodEnum<["ORG_ADMIN", "SUPPORT", "VIEWER"]>;
export type ManageableUserRole = z.infer<typeof manageableUserRoleSchema>;
export declare const createTeamInviteSchema: z.ZodObject<{
    organizationId: z.ZodOptional<z.ZodString>;
    email: z.ZodEffects<z.ZodString, string, string>;
    role: z.ZodDefault<z.ZodEnum<["ORG_ADMIN", "SUPPORT", "VIEWER"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    role: "ORG_ADMIN" | "SUPPORT" | "VIEWER";
    organizationId?: string | undefined;
}, {
    email: string;
    role?: "ORG_ADMIN" | "SUPPORT" | "VIEWER" | undefined;
    organizationId?: string | undefined;
}>;
export type CreateTeamInviteDto = z.infer<typeof createTeamInviteSchema>;
export declare const updateTeamMemberRoleSchema: z.ZodObject<{
    role: z.ZodEnum<["ORG_ADMIN", "SUPPORT", "VIEWER"]>;
}, "strip", z.ZodTypeAny, {
    role: "ORG_ADMIN" | "SUPPORT" | "VIEWER";
}, {
    role: "ORG_ADMIN" | "SUPPORT" | "VIEWER";
}>;
export type UpdateTeamMemberRoleDto = z.infer<typeof updateTeamMemberRoleSchema>;
export declare const acceptTeamInviteSchema: z.ZodObject<{
    token: z.ZodString;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    token: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    password?: string | undefined;
}, {
    token: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    password?: string | undefined;
}>;
export type AcceptTeamInviteDto = z.infer<typeof acceptTeamInviteSchema>;
