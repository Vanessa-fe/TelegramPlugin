"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.refreshSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});
exports.refreshSchema = zod_1.z
    .object({
    refreshToken: zod_1.z.string().min(1).optional(),
})
    .default({});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z
        .string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().min(1).optional(),
    organizationId: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=auth.schema.js.map