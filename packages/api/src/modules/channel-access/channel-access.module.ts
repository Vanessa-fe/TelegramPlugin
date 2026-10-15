import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChannelAccessQueue } from './channel-access.queue';
import { ChannelAccessService } from './channel-access.service';
import { ChannelAccessController } from './channel-access.controller';
import { TelegramLinkController } from './telegram-link.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, ConfigModule, NotificationsModule, AuditLogModule],
  controllers: [ChannelAccessController, TelegramLinkController],
  providers: [ChannelAccessService, ChannelAccessQueue],
  exports: [ChannelAccessService, ChannelAccessQueue],
})
export class ChannelAccessModule {}
