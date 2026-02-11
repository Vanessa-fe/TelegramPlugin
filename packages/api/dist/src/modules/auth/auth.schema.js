"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswordSchema = exports.updateProfileSchema = exports.registerSchema = exports.refreshSchema = exports.loginSchema = exports.passwordSchema = void 0;
const zod_1 = require("zod");
exports.passwordSchema = zod_1.z
    .string()
    .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
    .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~;']/, 'Le mot de passe doit contenir au moins un caractère spécial');
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, 'Le mot de passe est requis'),
});
exports.refreshSchema = zod_1.z
    .object({
    refreshToken: zod_1.z.string().min(1).optional(),
})
    .default({});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: exports.passwordSchema,
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().min(1).optional(),
    organizationId: zod_1.z.string().uuid().optional(),
});
exports.updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Email invalide').optional(),
    currentPassword: zod_1.z.string().min(1).optional(),
});
exports.updatePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1).optional(),
    newPassword: exports.passwordSchema,
});
//# sourceMappingURL=auth.schema.js.map