"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const metadataSchema = zod_1.z.record(zod_1.z.any()).optional();
exports.createProductSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(120),
    description: zod_1.z.string().max(2048).optional(),
    status: zod_1.z.nativeEnum(client_1.ProductStatus).optional(),
    metadata: metadataSchema,
});
exports.updateProductSchema = exports.createProductSchema.partial();
//# sourceMappingURL=products.schema.js.map