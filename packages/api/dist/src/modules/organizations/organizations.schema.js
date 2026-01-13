"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrganizationSchema = exports.createOrganizationSchema = void 0;
const zod_1 = require("zod");
const metadataSchema = zod_1.z.record(zod_1.z.any()).optional();
exports.createOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    slug: zod_1.z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9-]+$/, {
        message: 'Le slug doit contenir uniquement des lettres, chiffres ou tirets',
    })
        .transform((value) => value.toLowerCase()),
    billingEmail: zod_1.z.string().email(),
    timezone: zod_1.z.string().min(1).optional(),
    metadata: metadataSchema,
});
exports.updateOrganizationSchema = exports.createOrganizationSchema
    .partial()
    .extend({
    slug: exports.createOrganizationSchema.shape.slug.optional(),
});
//# sourceMappingURL=organizations.schema.js.map