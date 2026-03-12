import { Module } from '@nestjs/common';
import { GiftCodesController } from './gift-codes.controller';
import { GiftCodesService } from './gift-codes.service';

@Module({
  controllers: [GiftCodesController],
  providers: [GiftCodesService],
  exports: [GiftCodesService],
})
export class GiftCodesModule {}
