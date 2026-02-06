import { Body, Controller, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../common';
import { Public } from '../auth/decorators/public.decorator';
import { contactSchema, type ContactDto } from './contact.schema';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  async submitContact(
    @Body(new ZodValidationPipe(contactSchema)) body: ContactDto,
  ): Promise<{ success: true }> {
    await this.contactService.sendContactMessage(body);
    return { success: true };
  }
}
