import type { CreatePaymentEventDto } from './payment-events.schema';
import { PaymentEventsService } from './payment-events.service';
import type { AuthUser } from '../auth/auth.types';
export declare class PaymentEventsController {
    private readonly paymentEventsService;
    constructor(paymentEventsService: PaymentEventsService);
    findAll(user: AuthUser, organizationId?: string): Promise<{
        organizationId: string;
        subscriptionId: string | null;
        provider: import("@prisma/client").$Enums.PaymentProvider;
        type: import("@prisma/client").$Enums.PaymentEventType;
        externalId: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        occurredAt: Date;
        id: string;
        processedAt: Date | null;
        createdAt: Date;
    }[]>;
    findOne(user: AuthUser, id: string): Promise<{
        organizationId: string;
        subscriptionId: string | null;
        provider: import("@prisma/client").$Enums.PaymentProvider;
        type: import("@prisma/client").$Enums.PaymentEventType;
        externalId: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        occurredAt: Date;
        id: string;
        processedAt: Date | null;
        createdAt: Date;
    }>;
    create(user: AuthUser, body: CreatePaymentEventDto): Promise<{
        organizationId: string;
        subscriptionId: string | null;
        provider: import("@prisma/client").$Enums.PaymentProvider;
        type: import("@prisma/client").$Enums.PaymentEventType;
        externalId: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        occurredAt: Date;
        id: string;
        processedAt: Date | null;
        createdAt: Date;
    }>;
}
