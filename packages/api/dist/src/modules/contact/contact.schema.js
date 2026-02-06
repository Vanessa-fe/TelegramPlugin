"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactSchema = void 0;
const zod_1 = require("zod");
exports.contactSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(120),
    email: zod_1.z.string().email().max(254),
    subject: zod_1.z.string().min(2).max(160),
    message: zod_1.z.string().min(10).max(5000),
});
//# sourceMappingURL=contact.schema.js.map