import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export interface NotificationPayload {
    customerId: string;
    subscriptionId?: string;
    type: NotificationType;
    data?: Record<string, unknown>;
}
export declare enum NotificationType {
    PAYMENT_SUCCESS = "payment_success",
    PAYMENT_FAILED = "payment_failed",
    SUBSCRIPTION_RENEWED = "subscription_renewed",
    SUBSCRIPTION_CANCELED = "subscription_canceled",
    REFUND_PROCESSED = "refund_processed",
    CHANNEL_ACCESS_GRANTED = "channel_access_granted",
    CHANNEL_ACCESS_REVOKED = "channel_access_revoked",
    INVITE_LINK_SENT = "invite_link_sent",
    SUBSCRIPTION_EXPIRING = "subscription_expiring",
    PAYMENT_REMINDER = "payment_reminder"
}
export declare class NotificationsService implements OnModuleInit {
    private readonly config;
    private readonly prisma;
    private readonly logger;
    private readonly telegramBotToken;
    private readonly brevoEnabled;
    private readonly brevoFromEmail;
    private readonly brevoFromName;
    private brevoApi;
    constructor(config: ConfigService, prisma: PrismaService);
    onModuleInit(): void;
    sendNotification(payload: NotificationPayload): Promise<void>;
    sendChannelInvite(customerId: string, channelTitle: string, inviteLink: string): Promise<void>;
    sendPaymentConfirmation(customerId: string, subscriptionId: string, amount: number, currency: string, planName: string): Promise<void>;
    sendPaymentFailed(customerId: string, subscriptionId: string, reason: string): Promise<void>;
    sendAccessGranted(customerId: string, channelTitle: string, inviteLink?: string): Promise<void>;
    sendAccessRevoked(customerId: string, channelTitle: string, reason: string): Promise<void>;
    sendSubscriptionCanceled(customerId: string, planName: string): Promise<void>;
    sendSubscriptionRenewed(customerId: string, planName: string, nextBillingDate: Date): Promise<void>;
    private sendEmail;
    private wrapEmailTemplate;
    private htmlToText;
    private sendTelegram;
    private getTemplate;
    private formatAmount;
}
