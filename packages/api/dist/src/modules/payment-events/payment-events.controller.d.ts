import type { CreatePaymentEventDto } from './payment-events.schema';
import { PaymentEventsService } from './payment-events.service';
import type { AuthUser } from '../auth/auth.types';
export declare class PaymentEventsController {
    private readonly paymentEventsService;
    constructor(paymentEventsService: PaymentEventsService);
    findAll(user: AuthUser, organizationId?: string): Promise<{
        id: string;
        createdAt: Date;
        organizationId: string;
        externalId: string;
        subscriptionId: string | null;
        provider: import("@prisma/client").$Enums.PaymentProvider;
        type: import("@prisma/client").$Enums.PaymentEventType;
        payload: import("@prisma/client/runtime/library").JsonValue;
        occurredAt: Date;
        processedAt: Date | null;
    }[]>;
    findOne(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        organizationId: string;
        externalId: string;
        subscriptionId: string | null;
        provider: import("@prisma/client").$Enums.PaymentProvider;
        type: import("@prisma/client").$Enums.PaymentEventType;
        payload: import("@prisma/client/runtime/library").JsonValue;
        occurredAt: Date;
        processedAt: Date | null;
    }>;
    create(user: AuthUser, body: CreatePaymentEventDto): Promise<{
        id: string;
        createdAt: Date;
        organizationId: string;
        externalId: string;
        subscriptionId: string | null;
        provider: import("@prisma/client").$Enums.PaymentProvider;
        type: import("@prisma/client").$Enums.PaymentEventType;
        payload: import("@prisma/client/runtime/library").JsonValue;
        occurredAt: Date;
        processedAt: Date | null;
    }>;
}
