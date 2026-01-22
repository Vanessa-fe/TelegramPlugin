import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChannelAccessModule } from '../channel-access/channel-access.module';
import { TelegramStarsController } from './telegram-stars.controller';
import { TelegramStarsService } from './telegram-stars.service';

@Module({
  imports: [ConfigModule, PrismaModule, ChannelAccessModule],
  controllers: [TelegramStarsController],
  providers: [TelegramStarsService],
})
export class TelegramStarsModule {}
