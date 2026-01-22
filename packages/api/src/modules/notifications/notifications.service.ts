import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Brevo from '@getbrevo/brevo';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotificationPayload {
  customerId: string;
  subscriptionId?: string;
  type: NotificationType;
  data?: Record<string, unknown>;
}

export enum NotificationType {
  // Payment notifications
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  SUBSCRIPTION_CANCELED = 'subscription_canceled',
  REFUND_PROCESSED = 'refund_processed',

  // Access notifications
  CHANNEL_ACCESS_GRANTED = 'channel_access_granted',
  CHANNEL_ACCESS_REVOKED = 'channel_access_revoked',
  INVITE_LINK_SENT = 'invite_link_sent',

  // Reminder notifications
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  PAYMENT_REMINDER = 'payment_reminder',
}

interface NotificationTemplate {
  subject: string;
  emailBody: string;
  telegramMessage: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly telegramBotToken: string | undefined;
  private readonly brevoEnabled: boolean;
  private readonly brevoFromEmail: string;
  private readonly brevoFromName: string;
  private brevoApi: Brevo.TransactionalEmailsApi | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.telegramBotToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    this.brevoFromEmail = this.config.get<string>('BREVO_FROM_EMAIL') || 'noreply@example.com';
    this.brevoFromName = this.config.get<string>('BREVO_FROM_NAME') || 'Telegram Plugin';

    // Check if Brevo is configured
    const brevoApiKey = this.config.get<string>('BREVO_API_KEY');
    this.brevoEnabled = !!brevoApiKey;
  }

  onModuleInit() {
    if (this.brevoEnabled) {
      this.brevoApi = new Brevo.TransactionalEmailsApi();
      this.brevoApi.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey,
        this.config.get<string>('BREVO_API_KEY') || '',
      );
      this.logger.log('Brevo email service initialized');
    } else {
      this.logger.warn('Brevo not configured - emails will be logged only');
    }
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: payload.customerId },
      include: {
        organization: true,
      },
    });

    if (!customer) {
      this.logger.warn(`Customer ${payload.customerId} not found for notification`);
      return;
    }

    const template = this.getTemplate(payload.type, payload.data);

    // Send email notification if customer has email
    if (customer.email) {
      await this.sendEmail(customer.email, template.subject, template.emailBody);
    }

    // Send Telegram notification if customer has telegramUserId
    if (customer.telegramUserId && this.telegramBotToken) {
      await this.sendTelegram(customer.telegramUserId, template.telegramMessage);
    }

    // Log the notification
    this.logger.log(
      `Notification sent: ${payload.type} to customer ${customer.id}`,
    );
  }

  async sendChannelInvite(
    customerId: string,
    channelTitle: string,
    inviteLink: string,
  ): Promise<void> {
    await this.sendNotification({
      customerId,
      type: NotificationType.INVITE_LINK_SENT,
      data: {
        channelTitle,
        inviteLink,
      },
    });
  }

  async sendPaymentConfirmation(
    customerId: string,
    subscriptionId: string,
    amount: number,
    currency: string,
    planName: string,
  ): Promise<void> {
    await this.sendNotification({
      customerId,
      subscriptionId,
      type: NotificationType.PAYMENT_SUCCESS,
      data: {
        amount,
        currency,
        planName,
        formattedAmount: this.formatAmount(amount, currency),
      },
    });
  }

  async sendPaymentFailed(
    customerId: string,
    subscriptionId: string,
    reason: string,
  ): Promise<void> {
    await this.sendNotification({
      customerId,
      subscriptionId,
      type: NotificationType.PAYMENT_FAILED,
      data: {
        reason,
      },
    });
  }

  async sendAccessGranted(
    customerId: string,
    channelTitle: string,
    inviteLink?: string,
  ): Promise<void> {
    await this.sendNotification({
      customerId,
      type: NotificationType.CHANNEL_ACCESS_GRANTED,
      data: {
        channelTitle,
        inviteLink,
      },
    });
  }

  async sendAccessRevoked(
    customerId: string,
    channelTitle: string,
    reason: string,
  ): Promise<void> {
    await this.sendNotification({
      customerId,
      type: NotificationType.CHANNEL_ACCESS_REVOKED,
      data: {
        channelTitle,
        reason,
      },
    });
  }

  async sendSubscriptionCanceled(
    customerId: string,
    planName: string,
  ): Promise<void> {
    await this.sendNotification({
      customerId,
      type: NotificationType.SUBSCRIPTION_CANCELED,
      data: {
        planName,
      },
    });
  }

  async sendSubscriptionRenewed(
    customerId: string,
    planName: string,
    nextBillingDate: Date,
  ): Promise<void> {
    await this.sendNotification({
      customerId,
      type: NotificationType.SUBSCRIPTION_RENEWED,
      data: {
        planName,
        nextBillingDate: nextBillingDate.toLocaleDateString('fr-FR'),
      },
    });
  }

  private async sendEmail(
    to: string,
    subject: string,
    body: string,
  ): Promise<void> {
    // If Brevo is not configured, just log the email
    if (!this.brevoApi || !this.brevoEnabled) {
      this.logger.log(`[EMAIL - DEV MODE] To: ${to}, Subject: ${subject}`);
      this.logger.debug(`[EMAIL - DEV MODE] Body: ${body}`);
      return;
    }

    try {
      const htmlBody = this.wrapEmailTemplate(body, subject);

      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.sender = {
        email: this.brevoFromEmail,
        name: this.brevoFromName,
      };
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlBody;
      sendSmtpEmail.textContent = this.htmlToText(body);

      await this.brevoApi.sendTransacEmail(sendSmtpEmail);
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${(error as Error).message}`,
      );
      // Don't throw - we don't want email failures to break the flow
    }
  }

  private wrapEmailTemplate(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 20px; }
    p { margin: 10px 0; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  ${content}
  <div class="footer">
    <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
  </div>
</body>
</html>
    `.trim();
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async sendTelegram(
    telegramUserId: string,
    message: string,
  ): Promise<void> {
    if (!this.telegramBotToken) {
      this.logger.warn('Telegram bot token not configured, skipping notification');
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramUserId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Failed to send Telegram message: ${error}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send Telegram notification: ${(error as Error).message}`,
      );
    }
  }

  private getTemplate(
    type: NotificationType,
    data?: Record<string, unknown>,
  ): NotificationTemplate {
    const templates: Record<NotificationType, NotificationTemplate> = {
      [NotificationType.PAYMENT_SUCCESS]: {
        subject: 'Paiement confirmé',
        emailBody: `
          <h1>Paiement confirmé</h1>
          <p>Votre paiement de ${data?.formattedAmount || ''} pour le plan "${data?.planName || ''}" a été traité avec succès.</p>
          <p>Merci pour votre confiance !</p>
        `,
        telegramMessage: `✅ <b>Paiement confirmé</b>\n\nVotre paiement de ${data?.formattedAmount || ''} pour le plan "${data?.planName || ''}" a été traité avec succès.\n\nMerci pour votre confiance !`,
      },

      [NotificationType.PAYMENT_FAILED]: {
        subject: 'Échec du paiement',
        emailBody: `
          <h1>Échec du paiement</h1>
          <p>Nous n'avons pas pu traiter votre paiement.</p>
          <p>Raison : ${data?.reason || 'Erreur inconnue'}</p>
          <p>Veuillez mettre à jour vos informations de paiement pour maintenir votre accès.</p>
        `,
        telegramMessage: `❌ <b>Échec du paiement</b>\n\nNous n'avons pas pu traiter votre paiement.\nRaison : ${data?.reason || 'Erreur inconnue'}\n\nVeuillez mettre à jour vos informations de paiement.`,
      },

      [NotificationType.SUBSCRIPTION_RENEWED]: {
        subject: 'Abonnement renouvelé',
        emailBody: `
          <h1>Abonnement renouvelé</h1>
          <p>Votre abonnement "${data?.planName || ''}" a été renouvelé avec succès.</p>
          <p>Prochaine facturation : ${data?.nextBillingDate || ''}</p>
        `,
        telegramMessage: `🔄 <b>Abonnement renouvelé</b>\n\nVotre abonnement "${data?.planName || ''}" a été renouvelé avec succès.\n\nProchaine facturation : ${data?.nextBillingDate || ''}`,
      },

      [NotificationType.SUBSCRIPTION_CANCELED]: {
        subject: 'Abonnement annulé',
        emailBody: `
          <h1>Abonnement annulé</h1>
          <p>Votre abonnement "${data?.planName || ''}" a été annulé.</p>
          <p>Vous conservez votre accès jusqu'à la fin de la période payée.</p>
        `,
        telegramMessage: `⚠️ <b>Abonnement annulé</b>\n\nVotre abonnement "${data?.planName || ''}" a été annulé.\n\nVous conservez votre accès jusqu'à la fin de la période payée.`,
      },

      [NotificationType.REFUND_PROCESSED]: {
        subject: 'Remboursement effectué',
        emailBody: `
          <h1>Remboursement effectué</h1>
          <p>Votre remboursement a été traité avec succès.</p>
          <p>Le montant sera crédité sur votre compte dans les 5 à 10 jours ouvrés.</p>
        `,
        telegramMessage: `💸 <b>Remboursement effectué</b>\n\nVotre remboursement a été traité avec succès.\n\nLe montant sera crédité sur votre compte dans les 5 à 10 jours ouvrés.`,
      },

      [NotificationType.CHANNEL_ACCESS_GRANTED]: {
        subject: 'Accès accordé',
        emailBody: `
          <h1>Accès accordé</h1>
          <p>Votre accès au channel "${data?.channelTitle || ''}" a été activé.</p>
          ${data?.inviteLink ? `<p><a href="${data.inviteLink}">Cliquez ici pour rejoindre</a></p>` : ''}
        `,
        telegramMessage: `🎉 <b>Accès accordé</b>\n\nVotre accès au channel "${data?.channelTitle || ''}" a été activé.${data?.inviteLink ? `\n\n👉 <a href="${data.inviteLink}">Rejoindre le channel</a>` : ''}`,
      },

      [NotificationType.CHANNEL_ACCESS_REVOKED]: {
        subject: 'Accès révoqué',
        emailBody: `
          <h1>Accès révoqué</h1>
          <p>Votre accès au channel "${data?.channelTitle || ''}" a été révoqué.</p>
          <p>Raison : ${data?.reason || 'Non spécifiée'}</p>
        `,
        telegramMessage: `🚫 <b>Accès révoqué</b>\n\nVotre accès au channel "${data?.channelTitle || ''}" a été révoqué.\n\nRaison : ${data?.reason || 'Non spécifiée'}`,
      },

      [NotificationType.INVITE_LINK_SENT]: {
        subject: 'Lien d\'invitation',
        emailBody: `
          <h1>Votre lien d'invitation</h1>
          <p>Voici votre lien pour rejoindre le channel "${data?.channelTitle || ''}":</p>
          <p><a href="${data?.inviteLink || '#'}">${data?.inviteLink || ''}</a></p>
          <p><em>Ce lien est personnel et à usage unique.</em></p>
        `,
        telegramMessage: `📨 <b>Lien d'invitation</b>\n\nVoici votre lien pour rejoindre le channel "${data?.channelTitle || ''}":\n\n👉 <a href="${data?.inviteLink || '#'}">Rejoindre maintenant</a>\n\n<i>Ce lien est personnel et à usage unique.</i>`,
      },

      [NotificationType.SUBSCRIPTION_EXPIRING]: {
        subject: 'Votre abonnement expire bientôt',
        emailBody: `
          <h1>Abonnement bientôt expiré</h1>
          <p>Votre abonnement expire dans quelques jours.</p>
          <p>Renouvelez-le maintenant pour continuer à profiter de votre accès.</p>
        `,
        telegramMessage: `⏰ <b>Abonnement bientôt expiré</b>\n\nVotre abonnement expire dans quelques jours.\n\nRenouvelez-le maintenant pour continuer à profiter de votre accès.`,
      },

      [NotificationType.PAYMENT_REMINDER]: {
        subject: 'Rappel de paiement',
        emailBody: `
          <h1>Rappel de paiement</h1>
          <p>Nous n'avons pas pu traiter votre paiement.</p>
          <p>Veuillez mettre à jour vos informations de paiement pour éviter toute interruption de service.</p>
        `,
        telegramMessage: `💳 <b>Rappel de paiement</b>\n\nNous n'avons pas pu traiter votre paiement.\n\nVeuillez mettre à jour vos informations de paiement.`,
      },
    };

    return templates[type];
  }

  private formatAmount(amountCents: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  }
}
