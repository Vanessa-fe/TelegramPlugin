"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentEventSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createPaymentEventSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid(),
    subscriptionId: zod_1.z.string().uuid().optional(),
    provider: zod_1.z.nativeEnum(client_1.PaymentProvider),
    type: zod_1.z.nativeEnum(client_1.PaymentEventType),
    externalId: zod_1.z.string().min(1),
    payload: zod_1.z.record(zod_1.z.any()),
    occurredAt: zod_1.z.coerce.date().optional(),
});
//# sourceMappingURL=payment-events.schema.js.map