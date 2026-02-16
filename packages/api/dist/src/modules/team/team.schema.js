"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptTeamInviteSchema = exports.updateTeamMemberRoleSchema = exports.createTeamInviteSchema = exports.manageableUserRoleSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_schema_1 = require("../auth/auth.schema");
exports.manageableUserRoleSchema = zod_1.z.enum([
    client_1.UserRole.ORG_ADMIN,
    client_1.UserRole.SUPPORT,
    client_1.UserRole.VIEWER,
]);
exports.createTeamInviteSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid().optional(),
    email: zod_1.z
        .string()
        .email('Email invalide')
        .transform((value) => value.trim().toLowerCase()),
    role: exports.manageableUserRoleSchema.default(client_1.UserRole.SUPPORT),
});
exports.updateTeamMemberRoleSchema = zod_1.z.object({
    role: exports.manageableUserRoleSchema,
});
exports.acceptTeamInviteSchema = zod_1.z.object({
    token: zod_1.z.string().min(16, 'Invitation invalide'),
    firstName: zod_1.z.string().max(80).optional(),
    lastName: zod_1.z.string().max(80).optional(),
    password: auth_schema_1.passwordSchema.optional(),
});
//# sourceMappingURL=team.schema.js.map