import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ChannelAccessModule } from '../channel-access/channel-access.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ChannelAccessModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
