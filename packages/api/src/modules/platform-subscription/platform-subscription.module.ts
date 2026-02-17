import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlatformSubscriptionController } from './platform-subscription.controller';
import { PlatformSubscriptionService } from './platform-subscription.service';

@Module({
  imports: [NotificationsModule],
  controllers: [PlatformSubscriptionController],
  providers: [PlatformSubscriptionService],
  exports: [PlatformSubscriptionService],
})
export class PlatformSubscriptionModule {}
