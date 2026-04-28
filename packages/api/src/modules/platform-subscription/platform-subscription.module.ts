import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PostHogModule } from '../posthog/posthog.module';
import { VipInvitationsModule } from '../vip-invitations/vip-invitations.module';
import { PlatformSubscriptionController } from './platform-subscription.controller';
import { PlatformSubscriptionService } from './platform-subscription.service';

@Module({
  imports: [NotificationsModule, PostHogModule, VipInvitationsModule],
  controllers: [PlatformSubscriptionController],
  providers: [PlatformSubscriptionService],
  exports: [PlatformSubscriptionService],
})
export class PlatformSubscriptionModule {}
