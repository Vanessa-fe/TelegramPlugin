import { BadRequestException } from '@nestjs/common';
import type { TurnstileService } from '../../common/turnstile.service';
import { ContactController } from './contact.controller';
import { contactSchema } from './contact.schema';
import type { ContactService } from './contact.service';

const validBody = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  subject: 'Question sur les tarifs',
  message: 'Bonjour, quelle est la commission ?',
};

describe('ContactController', () => {
  let sendContactMessage: jest.Mock;
  let assertHuman: jest.Mock;
  let controller: ContactController;

  beforeEach(() => {
    sendContactMessage = jest.fn().mockResolvedValue(undefined);
    assertHuman = jest.fn().mockResolvedValue(undefined);
    controller = new ContactController(
      { sendContactMessage } as unknown as ContactService,
      { assertHuman } as unknown as TurnstileService,
    );
  });

  it('checks Turnstile before sending the email', async () => {
    const body = contactSchema.parse({ ...validBody, turnstileToken: 'tok' });

    await expect(controller.submitContact(body)).resolves.toEqual({
      success: true,
    });
    expect(assertHuman).toHaveBeenCalledWith('tok', 'contact');
    expect(sendContactMessage).toHaveBeenCalledWith(body);
  });

  it('does not send anything when Turnstile rejects the submission', async () => {
    assertHuman.mockRejectedValue(new BadRequestException());

    await expect(
      controller.submitContact(contactSchema.parse(validBody)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(sendContactMessage).not.toHaveBeenCalled();
  });

  it('silently drops submissions that filled the honeypot', async () => {
    const body = contactSchema.parse({
      ...validBody,
      website: 'https://spam.example',
    });

    await expect(controller.submitContact(body)).resolves.toEqual({
      success: true,
    });
    expect(assertHuman).not.toHaveBeenCalled();
    expect(sendContactMessage).not.toHaveBeenCalled();
  });
});

describe('contactSchema', () => {
  it('rejects line breaks in fields that end up in the email subject', () => {
    expect(
      contactSchema.safeParse({ ...validBody, subject: 'Hi\r\nBcc: x@y.z' })
        .success,
    ).toBe(false);
    expect(
      contactSchema.safeParse({ ...validBody, name: 'A\nB' }).success,
    ).toBe(false);
  });
});
