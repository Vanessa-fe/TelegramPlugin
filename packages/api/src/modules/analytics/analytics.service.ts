import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PurchaseEventParams {
  transactionId: string;
  value: number;
  currency: string;
  clientId?: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly measurementId: string | undefined;
  private readonly apiSecret: string | undefined;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.measurementId = this.config.get<string>('GA4_MEASUREMENT_ID');
    this.apiSecret = this.config.get<string>('GA4_API_SECRET');
    this.enabled = !!(this.measurementId && this.apiSecret);

    if (!this.enabled) {
      this.logger.warn(
        'GA4 analytics disabled: GA4_MEASUREMENT_ID or GA4_API_SECRET not configured',
      );
    }
  }

  async trackPurchase(params: PurchaseEventParams): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const clientId = params.clientId || this.generateClientId();

    const payload = {
      client_id: clientId,
      events: [
        {
          name: 'purchase',
          params: {
            transaction_id: params.transactionId,
            value: params.value,
            currency: params.currency,
          },
        },
      ],
    };

    try {
      const url = `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.logger.error(
          `GA4 purchase event failed: ${response.status} ${response.statusText}`,
        );
        return;
      }

      this.logger.debug(
        `GA4 purchase event sent: ${params.transactionId} - ${params.value} ${params.currency}`,
      );
    } catch (error) {
      this.logger.error('Failed to send GA4 purchase event', error as Error);
    }
  }

  private generateClientId(): string {
    return `${Math.random().toString(36).substring(2)}.${Date.now()}`;
  }
}
