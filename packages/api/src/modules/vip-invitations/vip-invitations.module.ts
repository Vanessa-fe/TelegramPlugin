import { Module } from '@nestjs/common';
import { VipInvitationsController } from './vip-invitations.controller';
import { VipInvitationsService } from './vip-invitations.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [VipInvitationsController],
  providers: [VipInvitationsService],
  exports: [VipInvitationsService],
})
export class VipInvitationsModule {}
