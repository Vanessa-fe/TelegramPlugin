import { ConfigService } from '@nestjs/config';
interface PurchaseEventParams {
    transactionId: string;
    value: number;
    currency: string;
    clientId?: string;
}
export declare class AnalyticsService {
    private readonly config;
    private readonly logger;
    private readonly measurementId;
    private readonly apiSecret;
    private readonly enabled;
    constructor(config: ConfigService);
    trackPurchase(params: PurchaseEventParams): Promise<void>;
    private generateClientId;
}
export {};
