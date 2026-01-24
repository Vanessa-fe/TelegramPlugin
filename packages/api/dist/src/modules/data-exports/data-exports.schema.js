"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDataExportSchema = void 0;
const zod_1 = require("zod");
exports.createDataExportSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=data-exports.schema.js.map