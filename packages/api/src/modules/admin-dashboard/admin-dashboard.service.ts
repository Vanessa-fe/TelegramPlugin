import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentEventType } from '@prisma/client';

export interface DashboardStats {
  newClientsThisWeek: number;
  revenueThisWeek: number;
  ticketsUnanswered: number;
  failedPayments: number;
  churnRisk: number;
  vipExpiringSoon: number;
}

// Type for the invoice payload from Stripe
interface InvoicePayload {
  amount_paid?: number;
  amount_due?: number;
  currency?: string;
  customer_email?: string;
  customer_name?: string;
  hosted_invoice_url?: string;
}

export interface FailedPaymentItem {
  id: string;
  occurredAt: Date;
  amount: number;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  organizationName: string;
  subscriptionId: string | null;
  invoiceUrl: string | null;
}

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // New clients this week (organizations created in the last 7 days)
    const newClientsThisWeek = await this.prisma.organization.count({
      where: {
        createdAt: { gte: oneWeekAgo },
      },
    });

    // Revenue this week - calculate from INVOICE_PAID events
    const revenueThisWeek = await this.calculateRevenueThisWeek(oneWeekAgo);

    // Failed payments - count payment events with failed invoice type
    const failedPayments = await this.prisma.paymentEvent.count({
      where: {
        type: 'INVOICE_PAYMENT_FAILED',
        createdAt: { gte: oneWeekAgo },
      },
    });

    // VIP invitations expiring soon (within 5 days)
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const vipExpiringSoon = await this.prisma.vipInvitation.count({
      where: {
        status: 'ACTIVATED',
        expiresAt: {
          gte: now,
          lte: fiveDaysFromNow,
        },
      },
    });

    // Tickets unanswered (to be implemented in Phase 2)
    const ticketsUnanswered = 0;

    // Churn risk (creators with no activity in last 14 days)
    // To be implemented in Phase 2 with health score
    const churnRisk = 0;

    return {
      newClientsThisWeek,
      revenueThisWeek,
      ticketsUnanswered,
      failedPayments,
      churnRisk,
      vipExpiringSoon,
    };
  }

  /**
   * Calculate total revenue from successful payments in the given period.
   * Sums up amount_paid from INVOICE_PAID events.
   * Returns amount in cents (integer).
   */
  private async calculateRevenueThisWeek(since: Date): Promise<number> {
    try {
      // Get all successful invoice payments since the given date
      const paidInvoices = await this.prisma.paymentEvent.findMany({
        where: {
          type: PaymentEventType.INVOICE_PAID,
          occurredAt: { gte: since },
        },
        select: {
          payload: true,
        },
      });

      // Sum up the amounts from the payloads
      let totalRevenue = 0;
      for (const event of paidInvoices) {
        const payload = event.payload as InvoicePayload | null;
        if (payload?.amount_paid && typeof payload.amount_paid === 'number') {
          totalRevenue += payload.amount_paid;
        }
      }

      return totalRevenue;
    } catch (error) {
      this.logger.error('Failed to calculate revenue', error);
      return 0;
    }
  }

  /**
   * Get list of failed payment events with customer and organization details.
   * Returns recent failed payments (last 30 days by default).
   */
  async getFailedPaymentsList(days = 30): Promise<FailedPaymentItem[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const failedPayments = await this.prisma.paymentEvent.findMany({
      where: {
        type: PaymentEventType.INVOICE_PAYMENT_FAILED,
        occurredAt: { gte: since },
      },
      include: {
        organization: true,
        subscription: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
    });

    return failedPayments.map((event) => {
      const payload = event.payload as InvoicePayload | null;
      const customer = event.subscription?.customer;

      return {
        id: event.id,
        occurredAt: event.occurredAt,
        amount: payload?.amount_due ?? 0,
        currency: payload?.currency ?? 'eur',
        customerEmail: customer?.email ?? payload?.customer_email ?? null,
        customerName: customer?.displayName ?? payload?.customer_name ?? null,
        organizationName: event.organization.name,
        subscriptionId: event.subscriptionId,
        invoiceUrl: payload?.hosted_invoice_url ?? null,
      };
    });
  }
}
