import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChannelAccessModule } from '../channel-access/channel-access.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { DataDeletionsService } from './data-deletions.service';

@Module({
  imports: [PrismaModule, ChannelAccessModule, AuditLogModule],
  providers: [DataDeletionsService],
  exports: [DataDeletionsService],
})
export class DataDeletionsModule {}
