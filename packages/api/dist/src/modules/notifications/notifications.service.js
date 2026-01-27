"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = exports.NotificationType = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Brevo = __importStar(require("@getbrevo/brevo"));
const prisma_service_1 = require("../../prisma/prisma.service");
var NotificationType;
(function (NotificationType) {
    NotificationType["PAYMENT_SUCCESS"] = "payment_success";
    NotificationType["PAYMENT_FAILED"] = "payment_failed";
    NotificationType["SUBSCRIPTION_RENEWED"] = "subscription_renewed";
    NotificationType["SUBSCRIPTION_CANCELED"] = "subscription_canceled";
    NotificationType["REFUND_PROCESSED"] = "refund_processed";
    NotificationType["CHANNEL_ACCESS_GRANTED"] = "channel_access_granted";
    NotificationType["CHANNEL_ACCESS_REVOKED"] = "channel_access_revoked";
    NotificationType["INVITE_LINK_SENT"] = "invite_link_sent";
    NotificationType["SUBSCRIPTION_EXPIRING"] = "subscription_expiring";
    NotificationType["PAYMENT_REMINDER"] = "payment_reminder";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
let NotificationsService = NotificationsService_1 = class NotificationsService {
    config;
    prisma;
    logger = new common_1.Logger(NotificationsService_1.name);
    telegramBotToken;
    brevoEnabled;
    brevoFromEmail;
    brevoFromName;
    brevoApi = null;
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        this.telegramBotToken = this.config.get('TELEGRAM_BOT_TOKEN');
        this.brevoFromEmail =
            this.config.get('BREVO_FROM_EMAIL') || 'noreply@example.com';
        this.brevoFromName =
            this.config.get('BREVO_FROM_NAME') || 'Telegram Plugin';
        const brevoApiKey = this.config.get('BREVO_API_KEY');
        this.brevoEnabled = !!brevoApiKey;
    }
    onModuleInit() {
        if (this.brevoEnabled) {
            this.brevoApi = new Brevo.TransactionalEmailsApi();
            this.brevoApi.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, this.config.get('BREVO_API_KEY') || '');
            this.logger.log('Brevo email service initialized');
        }
        else {
            this.logger.warn('Brevo not configured - emails will be logged only');
        }
    }
    async sendNotification(payload) {
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
        if (customer.email) {
            await this.sendEmail(customer.email, template.subject, template.emailBody);
        }
        if (customer.telegramUserId && this.telegramBotToken) {
            await this.sendTelegram(customer.telegramUserId, template.telegramMessage);
        }
        this.logger.log(`Notification sent: ${payload.type} to customer ${customer.id}`);
    }
    async sendChannelInvite(customerId, channelTitle, inviteLink) {
        await this.sendNotification({
            customerId,
            type: NotificationType.INVITE_LINK_SENT,
            data: {
                channelTitle,
                inviteLink,
            },
        });
    }
    async sendPaymentConfirmation(customerId, subscriptionId, amount, currency, planName) {
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
    async sendPaymentFailed(customerId, subscriptionId, reason) {
        await this.sendNotification({
            customerId,
            subscriptionId,
            type: NotificationType.PAYMENT_FAILED,
            data: {
                reason,
            },
        });
    }
    async sendAccessGranted(customerId, channelTitle, inviteLink) {
        await this.sendNotification({
            customerId,
            type: NotificationType.CHANNEL_ACCESS_GRANTED,
            data: {
                channelTitle,
                inviteLink,
            },
        });
    }
    async sendAccessRevoked(customerId, channelTitle, reason) {
        await this.sendNotification({
            customerId,
            type: NotificationType.CHANNEL_ACCESS_REVOKED,
            data: {
                channelTitle,
                reason,
            },
        });
    }
    async sendSubscriptionCanceled(customerId, planName) {
        await this.sendNotification({
            customerId,
            type: NotificationType.SUBSCRIPTION_CANCELED,
            data: {
                planName,
            },
        });
    }
    async sendSubscriptionRenewed(customerId, planName, nextBillingDate) {
        await this.sendNotification({
            customerId,
            type: NotificationType.SUBSCRIPTION_RENEWED,
            data: {
                planName,
                nextBillingDate: nextBillingDate.toLocaleDateString('fr-FR'),
            },
        });
    }
    async sendEmail(to, subject, body) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
        }
    }
    wrapEmailTemplate(content, title) {
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
    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    async sendTelegram(telegramUserId, message) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send Telegram notification: ${error.message}`);
        }
    }
    getTemplate(type, data) {
        const templates = {
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
                subject: "Lien d'invitation",
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
    formatAmount(amountCents, currency) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amountCents / 100);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map