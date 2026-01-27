import { Module } from '@nestjs/common';
import { PlatformSubscriptionController } from './platform-subscription.controller';
import { PlatformSubscriptionService } from './platform-subscription.service';

@Module({
  controllers: [PlatformSubscriptionController],
  providers: [PlatformSubscriptionService],
  exports: [PlatformSubscriptionService],
})
export class PlatformSubscriptionModule {}
