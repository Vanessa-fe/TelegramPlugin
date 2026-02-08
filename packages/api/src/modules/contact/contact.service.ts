import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Brevo from '@getbrevo/brevo';
import type { ContactDto } from './contact.schema';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly brevoApi: Brevo.TransactionalEmailsApi | null = null;
  private readonly brevoEnabled: boolean;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly toEmail: string;

  constructor(private readonly config: ConfigService) {
    this.fromEmail =
      this.config.get<string>('BREVO_FROM_EMAIL') || 'noreply@example.com';
    this.fromName = this.config.get<string>('BREVO_FROM_NAME') || 'Sublynk';
    this.toEmail =
      this.config.get<string>('CONTACT_TO_EMAIL') || this.fromEmail;

    const brevoApiKey = this.config.get<string>('BREVO_API_KEY');
    this.brevoEnabled = !!brevoApiKey;

    if (this.brevoEnabled) {
      this.brevoApi = new Brevo.TransactionalEmailsApi();
      this.brevoApi.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey,
        brevoApiKey || '',
      );
      this.logger.log('Brevo contact email service initialized');
    } else {
      this.logger.warn(
        'Brevo not configured - contact emails will be logged only',
      );
    }
  }

  async sendContactMessage(dto: ContactDto): Promise<void> {
    const subject = `Contact: ${dto.subject}`;
    const messageHtml = this.renderHtml(dto);
    const messageText = this.renderText(dto);

    if (!this.brevoApi || !this.brevoEnabled) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('Email service not configured');
      }
      this.logger.log(
        `[CONTACT - DEV MODE] To: ${this.toEmail}, Subject: ${subject}`,
      );
      this.logger.debug(`[CONTACT - DEV MODE] Body: ${messageText}`);
      return;
    }

    try {
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.sender = {
        email: this.fromEmail,
        name: this.fromName,
      };
      sendSmtpEmail.replyTo = {
        email: dto.email,
        name: dto.name,
      };
      sendSmtpEmail.to = [{ email: this.toEmail }];
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = messageHtml;
      sendSmtpEmail.textContent = messageText;

      await this.brevoApi.sendTransacEmail(sendSmtpEmail);
      this.logger.log(`Contact email sent successfully to ${this.toEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send contact email: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException('Unable to send contact email');
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private renderHtml(dto: ContactDto): string {
    const message = this.escapeHtml(dto.message).replace(/\n/g, '<br />');
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contact Sublynk</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 20px; margin-bottom: 16px; }
    p { margin: 8px 0; }
    .meta { margin-bottom: 16px; }
    .meta strong { display: inline-block; width: 90px; }
    .message { background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Nouveau message de contact</h1>
  <div class="meta">
    <p><strong>Nom :</strong> ${this.escapeHtml(dto.name)}</p>
    <p><strong>Email :</strong> ${this.escapeHtml(dto.email)}</p>
    <p><strong>Sujet :</strong> ${this.escapeHtml(dto.subject)}</p>
  </div>
  <div class="message">
    ${message}
  </div>
</body>
</html>
    `.trim();
  }

  private renderText(dto: ContactDto): string {
    return [
      'Nouveau message de contact',
      `Nom: ${dto.name}`,
      `Email: ${dto.email}`,
      `Sujet: ${dto.subject}`,
      '',
      dto.message,
    ].join('\n');
  }
}
