import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Brevo from '@getbrevo/brevo';
import type { UserRole } from '@prisma/client';
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
  discordMessage: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly telegramBotToken: string | undefined;
  private readonly discordBotToken: string | undefined;
  private readonly brevoEnabled: boolean;
  private readonly brevoFromEmail: string;
  private readonly brevoFromName: string;
  private readonly adminEmail: string | undefined;
  private brevoApi: Brevo.TransactionalEmailsApi | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.telegramBotToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    this.discordBotToken = this.config.get<string>('DISCORD_BOT_TOKEN');
    this.brevoFromEmail =
      this.config.get<string>('BREVO_FROM_EMAIL') || 'noreply@example.com';
    this.brevoFromName =
      this.config.get<string>('BREVO_FROM_NAME') || 'Telegram Plugin';

    // Check if Brevo is configured
    const brevoApiKey = this.config.get<string>('BREVO_API_KEY');
    this.brevoEnabled = !!brevoApiKey;

    // Admin email for notifications
    this.adminEmail = this.config.get<string>('ADMIN_NOTIFICATION_EMAIL');
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
      this.logger.warn(
        `Customer ${payload.customerId} not found for notification`,
      );
      return;
    }

    const template = this.getTemplate(payload.type, payload.data);

    // Send email notification if customer has email
    if (customer.email) {
      await this.sendEmail(
        customer.email,
        template.subject,
        template.emailBody,
      );
    }

    // Send Telegram notification if customer has telegramUserId
    if (customer.telegramUserId && this.telegramBotToken) {
      await this.sendTelegram(
        customer.telegramUserId,
        template.telegramMessage,
      );
    }

    // Send Discord notification if customer has discordUserId
    if (customer.discordUserId && this.discordBotToken) {
      await this.sendDiscord(customer.discordUserId, template.discordMessage);
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

  async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    firstName?: string,
  ): Promise<void> {
    const subject = 'Réinitialisation de votre mot de passe';
    const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
    const body = `
      <h1>Réinitialiser votre mot de passe</h1>
      <p>${greeting}</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p><a href="${resetLink}">Réinitialiser mon mot de passe</a></p>
      <p>Ce lien expirera bientôt.</p>
    `;

    await this.sendEmail(to, subject, body);
  }

  async sendEmailVerificationEmail(
    to: string,
    verificationLink: string,
    firstName?: string,
  ): Promise<void> {
    const subject = 'Confirmez votre adresse email';
    const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
    const body = `
      <h1>Vérifiez votre adresse email</h1>
      <p>${greeting}</p>
      <p>Merci pour votre inscription. Cliquez sur le lien ci-dessous pour activer votre compte.</p>
      <p><a href="${verificationLink}">Vérifier mon email</a></p>
      <p>Ce lien expirera bientôt.</p>
    `;

    await this.sendEmail(to, subject, body);
  }

  async sendAccountAlreadyExistsEmail(
    to: string,
    loginLink: string,
    resetPasswordLink: string,
  ): Promise<void> {
    const subject = 'Tentative de création de compte';
    const body = `
      <h1>Tentative de création de compte</h1>
      <p>Bonjour,</p>
      <p>Quelqu'un a essayé de créer un compte avec votre adresse email. Si c'était vous, sachez qu'un compte existe déjà avec cette adresse.</p>
      <p>Vous pouvez :</p>
      <ul>
        <li><a href="${loginLink}">Vous connecter à votre compte existant</a></li>
        <li><a href="${resetPasswordLink}">Réinitialiser votre mot de passe</a> si vous l'avez oublié</li>
      </ul>
      <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
    `;

    await this.sendEmail(to, subject, body);
  }

  async sendTeamInviteEmail(
    to: string,
    organizationName: string,
    inviteLink: string,
    role: UserRole,
  ): Promise<void> {
    const roleLabels: Record<UserRole, string> = {
      SUPERADMIN: 'Super Admin',
      ORG_ADMIN: 'Admin organisation',
      SUPPORT: 'Support',
      VIEWER: 'Lecture seule',
    };

    const subject = `Invitation à rejoindre ${organizationName} sur Sublynk`;
    const body = `
      <h1>Invitation d'équipe</h1>
      <p>Vous avez été invité(e) à rejoindre <strong>${organizationName}</strong>.</p>
      <p>Rôle attribué : <strong>${roleLabels[role]}</strong></p>
      <p><a href="${inviteLink}">Accepter l'invitation</a></p>
      <p>Ce lien est valable pendant 7 jours.</p>
    `;

    await this.sendEmail(to, subject, body);
  }

  /**
   * Send VIP invitation email with special trial offer
   */
  async sendVipInvitationEmail(data: {
    to: string;
    activationLink: string;
    planName: string;
    trialDays: number;
    notes?: string;
  }): Promise<void> {
    const subject = `🎁 Invitation VIP - ${data.trialDays} jours d'essai gratuit sur Sublynk`;
    const body = `
      <h1>🎁 Vous êtes invité(e) en VIP !</h1>
      <p>Bonjour,</p>
      <p>Vous avez été sélectionné(e) pour bénéficier d'un accès privilégié à <strong>Sublynk</strong>, la plateforme de monétisation de communautés Telegram.</p>

      <h2>Votre offre exclusive</h2>
      <ul>
        <li><strong>Plan :</strong> ${data.planName}</li>
        <li><strong>Durée d'essai :</strong> ${data.trialDays} jours gratuits</li>
        <li><strong>Aucune carte bancaire requise</strong> pour commencer</li>
      </ul>

      ${data.notes ? `<p><em>Message personnalisé : ${data.notes}</em></p>` : ''}

      <p style="margin: 30px 0;">
        <a href="${data.activationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Activer mon essai gratuit
        </a>
      </p>

      <h2>Pourquoi Sublynk ?</h2>
      <ul>
        <li>✅ Vendez l'accès à vos channels Telegram en quelques clics</li>
        <li>✅ Gestion automatique des membres et des paiements</li>
        <li>✅ Tableau de bord complet avec analytics</li>
        <li>✅ Support réactif et communauté active</li>
      </ul>

      <p>Cette invitation est personnelle et liée à votre adresse email.</p>
      <p>À très bientôt sur Sublynk ! 🚀</p>
    `;

    await this.sendEmail(data.to, subject, body);
    this.logger.log(`VIP invitation email sent to ${data.to}`);
  }

  /**
   * Send notification to admin when a new platform subscription is created
   */
  async sendAdminNewSubscriptionNotification(data: {
    organizationName: string;
    organizationEmail: string;
    planName: string;
    amount: number;
    currency: string;
    isTrialing: boolean;
  }): Promise<void> {
    if (!this.adminEmail) {
      this.logger.debug(
        'No ADMIN_NOTIFICATION_EMAIL configured, skipping admin notification',
      );
      return;
    }

    const formattedAmount = this.formatAmount(data.amount, data.currency);
    const status = data.isTrialing ? '🎁 Essai gratuit' : '💰 Abonnement actif';

    const subject = `🎉 Nouveau client Sublynk : ${data.organizationName}`;
    const body = `
      <h1>🎉 Nouveau client !</h1>
      <p>Une nouvelle organisation vient de s'abonner à Sublynk.</p>

      <h2>Détails</h2>
      <ul>
        <li><strong>Organisation :</strong> ${data.organizationName}</li>
        <li><strong>Email :</strong> ${data.organizationEmail}</li>
        <li><strong>Plan :</strong> ${data.planName}</li>
        <li><strong>Montant :</strong> ${formattedAmount}/mois</li>
        <li><strong>Statut :</strong> ${status}</li>
      </ul>

      <p><em>Ce client a été ajouté automatiquement à ta liste dans le dashboard.</em></p>
    `;

    await this.sendEmail(this.adminEmail, subject, body);
    this.logger.log(
      `Admin notification sent for new subscription: ${data.organizationName}`,
    );
  }

  /**
   * Send notification to admin when a new user registers
   */
  async sendAdminNewUserNotification(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    method: 'email' | 'google';
  }): Promise<void> {
    if (!this.adminEmail) {
      this.logger.debug(
        'No ADMIN_NOTIFICATION_EMAIL configured, skipping admin notification',
      );
      return;
    }

    const fullName =
      [data.firstName, data.lastName].filter(Boolean).join(' ') ||
      'Non renseigné';
    const methodLabel =
      data.method === 'google' ? '🔵 Google OAuth' : '📧 Email/Mot de passe';

    const subject = `👤 Nouvel utilisateur : ${data.email}`;
    const body = `
      <h1>👤 Nouvel utilisateur inscrit</h1>

      <h2>Détails</h2>
      <ul>
        <li><strong>Email :</strong> ${data.email}</li>
        <li><strong>Nom :</strong> ${fullName}</li>
        <li><strong>Méthode :</strong> ${methodLabel}</li>
      </ul>

      <p><em>Cet utilisateur n'a pas encore souscrit à un plan.</em></p>
    `;

    await this.sendEmail(this.adminEmail, subject, body);
    this.logger.log(`Admin notification sent for new user: ${data.email}`);
  }

  private async sendEmail(
    to: string,
    subject: string,
    body: string,
  ): Promise<void> {
    // If Brevo is not configured, just log the email (without sensitive tokens)
    if (!this.brevoApi || !this.brevoEnabled) {
      this.logger.log(`[EMAIL - DEV MODE] To: ${to}, Subject: ${subject}`);
      // Redact sensitive tokens from body before logging to prevent token exposure
      const redactedBody = this.redactSensitiveUrls(body);
      this.logger.debug(`[EMAIL - DEV MODE] Body: ${redactedBody}`);
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
      this.logger.warn(
        'Telegram bot token not configured, skipping notification',
      );
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

  private async sendDiscord(
    discordUserId: string,
    message: string,
  ): Promise<void> {
    if (!this.discordBotToken) {
      this.logger.warn(
        'Discord bot token not configured, skipping notification',
      );
      return;
    }

    try {
      // First, create a DM channel with the user
      const createDmUrl = 'https://discord.com/api/v10/users/@me/channels';
      const dmResponse = await fetch(createDmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${this.discordBotToken}`,
        },
        body: JSON.stringify({
          recipient_id: discordUserId,
        }),
      });

      if (!dmResponse.ok) {
        const error = await dmResponse.text();
        this.logger.error(`Failed to create Discord DM channel: ${error}`);
        return;
      }

      const dmChannel = (await dmResponse.json()) as { id: string };

      // Then send the message to the DM channel
      const sendMessageUrl = `https://discord.com/api/v10/channels/${dmChannel.id}/messages`;
      const messageResponse = await fetch(sendMessageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${this.discordBotToken}`,
        },
        body: JSON.stringify({
          content: message,
        }),
      });

      if (!messageResponse.ok) {
        const error = await messageResponse.text();
        this.logger.error(`Failed to send Discord DM: ${error}`);
      } else {
        this.logger.log(`Discord DM sent to user ${discordUserId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send Discord notification: ${(error as Error).message}`,
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
        discordMessage: `✅ **Paiement confirmé**\n\nVotre paiement de ${data?.formattedAmount || ''} pour le plan "${data?.planName || ''}" a été traité avec succès.\n\nMerci pour votre confiance !`,
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
        discordMessage: `❌ **Échec du paiement**\n\nNous n'avons pas pu traiter votre paiement.\nRaison : ${data?.reason || 'Erreur inconnue'}\n\nVeuillez mettre à jour vos informations de paiement.`,
      },

      [NotificationType.SUBSCRIPTION_RENEWED]: {
        subject: 'Abonnement renouvelé',
        emailBody: `
          <h1>Abonnement renouvelé</h1>
          <p>Votre abonnement "${data?.planName || ''}" a été renouvelé avec succès.</p>
          <p>Prochaine facturation : ${data?.nextBillingDate || ''}</p>
        `,
        telegramMessage: `🔄 <b>Abonnement renouvelé</b>\n\nVotre abonnement "${data?.planName || ''}" a été renouvelé avec succès.\n\nProchaine facturation : ${data?.nextBillingDate || ''}`,
        discordMessage: `🔄 **Abonnement renouvelé**\n\nVotre abonnement "${data?.planName || ''}" a été renouvelé avec succès.\n\nProchaine facturation : ${data?.nextBillingDate || ''}`,
      },

      [NotificationType.SUBSCRIPTION_CANCELED]: {
        subject: 'Abonnement annulé',
        emailBody: `
          <h1>Abonnement annulé</h1>
          <p>Votre abonnement "${data?.planName || ''}" a été annulé.</p>
          <p>Vous conservez votre accès jusqu'à la fin de la période payée.</p>
        `,
        telegramMessage: `⚠️ <b>Abonnement annulé</b>\n\nVotre abonnement "${data?.planName || ''}" a été annulé.\n\nVous conservez votre accès jusqu'à la fin de la période payée.`,
        discordMessage: `⚠️ **Abonnement annulé**\n\nVotre abonnement "${data?.planName || ''}" a été annulé.\n\nVous conservez votre accès jusqu'à la fin de la période payée.`,
      },

      [NotificationType.REFUND_PROCESSED]: {
        subject: 'Remboursement effectué',
        emailBody: `
          <h1>Remboursement effectué</h1>
          <p>Votre remboursement a été traité avec succès.</p>
          <p>Le montant sera crédité sur votre compte dans les 5 à 10 jours ouvrés.</p>
        `,
        telegramMessage: `💸 <b>Remboursement effectué</b>\n\nVotre remboursement a été traité avec succès.\n\nLe montant sera crédité sur votre compte dans les 5 à 10 jours ouvrés.`,
        discordMessage: `💸 **Remboursement effectué**\n\nVotre remboursement a été traité avec succès.\n\nLe montant sera crédité sur votre compte dans les 5 à 10 jours ouvrés.`,
      },

      [NotificationType.CHANNEL_ACCESS_GRANTED]: {
        subject: 'Accès accordé',
        emailBody: `
          <h1>Accès accordé</h1>
          <p>Votre accès au channel "${data?.channelTitle || ''}" a été activé.</p>
          ${data?.inviteLink ? `<p><a href="${data.inviteLink}">Cliquez ici pour rejoindre</a></p>` : ''}
        `,
        telegramMessage: `🎉 <b>Accès accordé</b>\n\nVotre accès au channel "${data?.channelTitle || ''}" a été activé.${data?.inviteLink ? `\n\n👉 <a href="${data.inviteLink}">Rejoindre le channel</a>` : ''}`,
        discordMessage: `🎉 **Accès accordé**\n\nVotre accès au serveur "${data?.channelTitle || ''}" a été activé.\n\nVotre rôle a été attribué automatiquement.`,
      },

      [NotificationType.CHANNEL_ACCESS_REVOKED]: {
        subject: 'Accès révoqué',
        emailBody: `
          <h1>Accès révoqué</h1>
          <p>Votre accès au channel "${data?.channelTitle || ''}" a été révoqué.</p>
          <p>Raison : ${data?.reason || 'Non spécifiée'}</p>
        `,
        telegramMessage: `🚫 <b>Accès révoqué</b>\n\nVotre accès au channel "${data?.channelTitle || ''}" a été révoqué.\n\nRaison : ${data?.reason || 'Non spécifiée'}`,
        discordMessage: `🚫 **Accès révoqué**\n\nVotre accès au serveur "${data?.channelTitle || ''}" a été révoqué.\n\nRaison : ${data?.reason || 'Non spécifiée'}`,
      },

      [NotificationType.INVITE_LINK_SENT]: {
        subject: "Lien d'invitation",
        emailBody: `
          <h1>Votre lien d'invitation</h1>
          <p>Voici votre lien pour rejoindre le channel "${data?.channelTitle || ''}":</p>
          <p><a href="${data?.inviteLink || '#'}">${data?.inviteLink || ''}</a></p>
          <p><em>Ce lien est personnel et à usage unique.</em></p>
        `,
        telegramMessage: `📨 <b>Lien d'invitation</b>\n\nVoici votre lien pour rejoindre le channel "${data?.channelTitle || ''}":\n\n👉 <a href="${data?.inviteLink || '#'}">Rejoindre maintenant</a>\n\n<i>Ce lien est personnel et à usage unique.</i>`,
        discordMessage: `📨 **Lien d'invitation**\n\nVoici votre lien pour rejoindre le channel "${data?.channelTitle || ''}":\n\n👉 ${data?.inviteLink || ''}\n\n*Ce lien est personnel et à usage unique.*`,
      },

      [NotificationType.SUBSCRIPTION_EXPIRING]: {
        subject: 'Votre abonnement expire bientôt',
        emailBody: `
          <h1>Abonnement bientôt expiré</h1>
          <p>Votre abonnement expire dans quelques jours.</p>
          <p>Renouvelez-le maintenant pour continuer à profiter de votre accès.</p>
        `,
        telegramMessage: `⏰ <b>Abonnement bientôt expiré</b>\n\nVotre abonnement expire dans quelques jours.\n\nRenouvelez-le maintenant pour continuer à profiter de votre accès.`,
        discordMessage: `⏰ **Abonnement bientôt expiré**\n\nVotre abonnement expire dans quelques jours.\n\nRenouvelez-le maintenant pour continuer à profiter de votre accès.`,
      },

      [NotificationType.PAYMENT_REMINDER]: {
        subject: 'Rappel de paiement',
        emailBody: `
          <h1>Rappel de paiement</h1>
          <p>Nous n'avons pas pu traiter votre paiement.</p>
          <p>Veuillez mettre à jour vos informations de paiement pour éviter toute interruption de service.</p>
        `,
        telegramMessage: `💳 <b>Rappel de paiement</b>\n\nNous n'avons pas pu traiter votre paiement.\n\nVeuillez mettre à jour vos informations de paiement.`,
        discordMessage: `💳 **Rappel de paiement**\n\nNous n'avons pas pu traiter votre paiement.\n\nVeuillez mettre à jour vos informations de paiement.`,
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

  /**
   * Redact sensitive tokens from URLs in email body before logging.
   * This prevents tokens from being exposed in logs.
   */
  private redactSensitiveUrls(body: string): string {
    // Redact token query parameters in URLs
    // Matches: ?token=xxx or &token=xxx
    return body.replace(/([?&]token=)[A-Za-z0-9_-]+/gi, '$1[REDACTED]');
  }
}
