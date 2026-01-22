import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChannelAccessQueue } from './channel-access.queue';
import { ChannelAccessService } from './channel-access.service';
import { ChannelAccessController } from './channel-access.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, ConfigModule, NotificationsModule],
  controllers: [ChannelAccessController],
  providers: [ChannelAccessService, ChannelAccessQueue],
  exports: [ChannelAccessService],
})
export class ChannelAccessModule {}
