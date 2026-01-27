import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';
import { ChannelAccessModule } from '../channel-access/channel-access.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { PlatformSubscriptionModule } from '../platform-subscription/platform-subscription.module';

@Module({
  imports: [
    ConfigModule,
    ChannelAccessModule,
    AuditLogModule,
    PlatformSubscriptionModule,
  ],
  controllers: [StripeWebhookController],
  providers: [StripeWebhookService],
})
export class StripeWebhookModule {}
