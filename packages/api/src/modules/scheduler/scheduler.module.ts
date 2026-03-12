import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ChannelAccessModule } from '../channel-access/channel-access.module';
import { DataExportsModule } from '../data-exports/data-exports.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminDashboardModule } from '../admin-dashboard/admin-dashboard.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ChannelAccessModule,
    DataExportsModule,
    OrganizationsModule,
    NotificationsModule,
    AdminDashboardModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
