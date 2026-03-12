import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { DataDeletionsModule } from '../data-deletions/data-deletions.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ChannelAccessModule } from '../channel-access/channel-access.module';
import { PlatformSubscriptionModule } from '../platform-subscription/platform-subscription.module';

@Module({
  imports: [
    DataDeletionsModule,
    AuditLogModule,
    ChannelAccessModule,
    PlatformSubscriptionModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
