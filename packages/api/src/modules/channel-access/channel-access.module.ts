import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChannelAccessQueue } from './channel-access.queue';
import { ChannelAccessService } from './channel-access.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [ChannelAccessService, ChannelAccessQueue],
  exports: [ChannelAccessService],
})
export class ChannelAccessModule {}
