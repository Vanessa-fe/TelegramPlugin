import { Body, Controller, Logger, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from '../../common';
import { TurnstileService } from '../../common/turnstile.service';
import { Public } from '../auth/decorators/public.decorator';
import { contactSchema, type ContactDto } from './contact.schema';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  constructor(
    private readonly contactService: ContactService,
    private readonly turnstile: TurnstileService,
  ) {}

  @Public()
  @Post()
  @Throttle({
    short: { limit: 1, ttl: 1000 },
    medium: { limit: 3, ttl: 60_000 },
    long: { limit: 10, ttl: 3_600_000 },
  })
  async submitContact(
    @Body(new ZodValidationPipe(contactSchema)) body: ContactDto,
  ): Promise<{ success: true }> {
    if (body.website?.trim()) {
      // Answer like a success so the bot has no signal to adapt to.
      this.logger.warn('Contact form honeypot filled - message dropped');
      return { success: true };
    }

    await this.turnstile.assertHuman(body.turnstileToken, 'contact');

    await this.contactService.sendContactMessage(body);
    return { success: true };
  }
}
