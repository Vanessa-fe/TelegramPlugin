import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { VipInvitationsModule } from '../vip-invitations/vip-invitations.module';
import { ChannelAccessModule } from '../channel-access/channel-access.module';

@Module({
  imports: [VipInvitationsModule, ChannelAccessModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
