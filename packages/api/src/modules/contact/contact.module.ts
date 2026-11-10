import { Module } from '@nestjs/common';
import { TurnstileService } from '../../common/turnstile.service';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  controllers: [ContactController],
  providers: [ContactService, TurnstileService],
})
export class ContactModule {}
