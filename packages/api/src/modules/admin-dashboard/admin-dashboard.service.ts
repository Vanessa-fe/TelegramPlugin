import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentEventType, AmbassadorTier } from '@prisma/client';
import Stripe from 'stripe';

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
  organizationId: string;
  organizationName: string;
  subscriptionId: string | null;
  invoiceUrl: string | null;
}

export interface CommissionSummary {
  days: number;
  feeCount: number;
  totals: {
    currency: string;
    grossSalesCents: number;
    grossCommissionCents: number;
    refundedCommissionCents: number;
    netCommissionCents: number;
  }[];
  byOrganization: {
    organizationId: string | null;
    organizationName: string;
    stripeAccountId: string;
    platformPlan: string | null;
    feeCount: number;
    currency: string;
    grossSalesCents: number;
    grossCommissionCents: number;
    refundedCommissionCents: number;
    netCommissionCents: number;
  }[];
}

export type HealthScoreLevel = 'green' | 'orange' | 'red';

export interface HealthScore {
  level: HealthScoreLevel;
  score: number; // 0-100
  factors: {
    loginRecency: HealthScoreLevel;
    activityLevel: HealthScoreLevel;
    paymentStatus: HealthScoreLevel;
    revenueHealth: HealthScoreLevel;
  };
  lastLoginAt: Date | null;
  daysSinceLogin: number | null;
  recentSalesCount: number;
  recentRevenueChange: number | null; // percentage change
}

export interface CreatorListItem {
  id: string;
  name: string;
  slug: string;
  billingEmail: string;
  saasActive: boolean;
  suspendedAt: Date | null;
  createdAt: Date;
  ownerEmail: string | null;
  channelsCount: number;
  customersCount: number;
  activeSubscriptionsCount: number;
  platformPlan: string | null;
  platformStatus: string | null;
  // Payment risk indicators
  paymentRisk: {
    isAtRisk: boolean;
    daysOverdue: number | null;
    failedAttempts: number;
    daysUntilBlock: number | null;
  } | null;
  // Health score
  healthScore: HealthScore;
}

export interface CreatorDetail extends CreatorListItem {
  // Extended details
  ambassadorTier: AmbassadorTier;
  ambassadorSince: Date | null;
  lastLoyaltyRewardAt: Date | null;
  // Revenue stats
  totalRevenue: number;
  revenueThisMonth: number;
  revenuePreviousMonth: number;
  // Activity
  recentActivity: {
    id: string;
    action: string;
    resourceType: string;
    createdAt: Date;
    metadata: unknown;
  }[];
  // Payment history
  recentPayments: {
    id: string;
    type: string;
    occurredAt: Date;
    amount: number;
    currency: string;
  }[];
  // Channels info
  channels: {
    id: string;
    title: string | null;
    provider: string;
    type: string;
    isActive: boolean;
    accessCount: number;
  }[];
  // Products info
  products: {
    id: string;
    name: string;
    status: string;
    plansCount: number;
    subscriptionsCount: number;
  }[];
}

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const apiKey = config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = apiKey
      ? new Stripe(apiKey, { apiVersion: '2024-06-20' })
      : null;
  }

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

    // Tickets unanswered (OPEN status)
    const ticketsUnanswered = await this.prisma.ticket.count({
      where: { status: 'OPEN' },
    });

    // Churn risk - count creators with health score orange or red
    const churnRisk = await this.getChurnRiskCount();

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
        organizationId: event.organizationId,
        organizationName: event.organization.name,
        subscriptionId: event.subscriptionId,
        invoiceUrl: payload?.hosted_invoice_url ?? null,
      };
    });
  }

  async getCommissionSummary(days = 30): Promise<CommissionSummary> {
    const safeDays = Number.isFinite(days)
      ? Math.min(365, Math.max(1, Math.trunc(days)))
      : 30;
    const emptySummary: CommissionSummary = {
      days: safeDays,
      feeCount: 0,
      totals: [],
      byOrganization: [],
    };

    if (!this.stripe) {
      this.logger.warn('Stripe is not configured; commission summary is empty');
      return emptySummary;
    }

    try {
      const createdAfter = Math.floor(
        (Date.now() - safeDays * 24 * 60 * 60 * 1000) / 1000,
      );
      const fees: Stripe.ApplicationFee[] = [];
      let startingAfter: string | undefined;

      do {
        const page = await this.stripe.applicationFees.list({
          created: { gte: createdAfter },
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
          expand: ['data.charge'],
        });
        fees.push(...page.data);
        startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
      } while (startingAfter);

      if (fees.length === 0) {
        return emptySummary;
      }

      const accountIds = [
        ...new Set(
          fees
            .map((fee) =>
              typeof fee.account === 'string' ? fee.account : fee.account?.id,
            )
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const organizations = await this.prisma.organization.findMany({
        where: { stripeAccountId: { in: accountIds } },
        select: {
          id: true,
          name: true,
          stripeAccountId: true,
          platformSubscription: {
            select: { platformPlan: { select: { displayName: true, name: true } } },
          },
        },
      });
      const organizationsByAccount = new Map(
        organizations
          .filter((organization) => organization.stripeAccountId)
          .map((organization) => [organization.stripeAccountId!, organization]),
      );
      const totals = new Map<
        string,
        CommissionSummary['totals'][number]
      >();
      const breakdown = new Map<
        string,
        CommissionSummary['byOrganization'][number]
      >();

      for (const fee of fees) {
        const currency = fee.currency.toUpperCase();
        const accountId =
          typeof fee.account === 'string' ? fee.account : fee.account?.id;
        if (!accountId) continue;

        const charge =
          typeof fee.charge === 'object' && fee.charge
            ? fee.charge
            : null;
        const grossSalesCents = charge?.amount ?? 0;
        const refundedCommissionCents = fee.amount_refunded ?? 0;
        const netCommissionCents = fee.amount - refundedCommissionCents;
        const currencyTotal = totals.get(currency) ?? {
          currency,
          grossSalesCents: 0,
          grossCommissionCents: 0,
          refundedCommissionCents: 0,
          netCommissionCents: 0,
        };
        currencyTotal.grossSalesCents += grossSalesCents;
        currencyTotal.grossCommissionCents += fee.amount;
        currencyTotal.refundedCommissionCents += refundedCommissionCents;
        currencyTotal.netCommissionCents += netCommissionCents;
        totals.set(currency, currencyTotal);

        const organization = organizationsByAccount.get(accountId);
        const key = `${accountId}:${currency}`;
        const item = breakdown.get(key) ?? {
          organizationId: organization?.id ?? null,
          organizationName: organization?.name ?? 'Compte Stripe inconnu',
          stripeAccountId: accountId,
          platformPlan:
            organization?.platformSubscription?.platformPlan?.displayName ??
            organization?.platformSubscription?.platformPlan?.name ??
            null,
          feeCount: 0,
          currency,
          grossSalesCents: 0,
          grossCommissionCents: 0,
          refundedCommissionCents: 0,
          netCommissionCents: 0,
        };
        item.feeCount += 1;
        item.grossSalesCents += grossSalesCents;
        item.grossCommissionCents += fee.amount;
        item.refundedCommissionCents += refundedCommissionCents;
        item.netCommissionCents += netCommissionCents;
        breakdown.set(key, item);
      }

      return {
        days: safeDays,
        feeCount: fees.length,
        totals: [...totals.values()],
        byOrganization: [...breakdown.values()].sort(
          (left, right) =>
            right.netCommissionCents - left.netCommissionCents,
        ),
      };
    } catch (error) {
      this.logger.error('Failed to load Stripe commission summary', error);
      return emptySummary;
    }
  }

  /**
   * Get list of all creators (organizations) with enriched data for admin view.
   */
  async getCreatorsList(): Promise<CreatorListItem[]> {
    const now = new Date();
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_IN_MS);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_IN_MS);

    const organizations = await this.prisma.organization.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        users: {
          where: { role: 'ORG_ADMIN' },
          select: { email: true, lastLoginAt: true },
          take: 1,
        },
        channels: {
          select: { id: true },
        },
        customers: {
          where: { deletedAt: null },
          select: { id: true },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: { id: true, createdAt: true },
        },
        platformSubscription: {
          select: {
            status: true,
            metadata: true,
            platformPlan: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get recent sales counts per organization (last 30 days vs previous 30 days)
    const recentSales = await this.prisma.subscription.groupBy({
      by: ['organizationId'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    const previousSales = await this.prisma.subscription.groupBy({
      by: ['organizationId'],
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    const recentSalesMap = new Map(
      recentSales.map((s) => [s.organizationId, s._count.id]),
    );
    const previousSalesMap = new Map(
      previousSales.map((s) => [s.organizationId, s._count.id]),
    );

    return organizations.map((org) => {
      // Calculate payment risk
      let paymentRisk: CreatorListItem['paymentRisk'] = null;

      if (org.platformSubscription?.status === 'PAST_DUE') {
        const metadata =
          (org.platformSubscription.metadata as Record<
            string,
            unknown
          > | null) ?? {};
        const failedAttempts = (metadata.failedPaymentAttempts as number) ?? 0;
        const firstFailedAt = metadata.firstFailedAt
          ? new Date(metadata.firstFailedAt as string)
          : null;

        const daysOverdue = firstFailedAt
          ? Math.floor((now.getTime() - firstFailedAt.getTime()) / DAY_IN_MS)
          : 0;

        const daysUntilBlock =
          failedAttempts >= 3 ? 0 : Math.max(0, 7 - daysOverdue);

        paymentRisk = {
          isAtRisk: true,
          daysOverdue,
          failedAttempts,
          daysUntilBlock,
        };
      }

      // Calculate health score
      const healthScore = this.calculateHealthScore(
        org,
        now,
        DAY_IN_MS,
        recentSalesMap.get(org.id) ?? 0,
        previousSalesMap.get(org.id) ?? 0,
      );

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        billingEmail: org.billingEmail,
        saasActive: org.saasActive,
        suspendedAt: org.suspendedAt,
        createdAt: org.createdAt,
        ownerEmail: org.users[0]?.email ?? null,
        channelsCount: org.channels.length,
        customersCount: org.customers.length,
        activeSubscriptionsCount: org.subscriptions.length,
        platformPlan: org.platformSubscription?.platformPlan?.name ?? null,
        platformStatus: org.platformSubscription?.status ?? null,
        paymentRisk,
        healthScore,
      };
    });
  }

  /**
   * Calculate health score for a creator based on multiple factors
   */
  private calculateHealthScore(
    org: {
      users: { lastLoginAt: Date | null }[];
      subscriptions: { createdAt: Date }[];
      platformSubscription: { status: string } | null;
      suspendedAt: Date | null;
      saasActive: boolean;
    },
    now: Date,
    DAY_IN_MS: number,
    recentSalesCount: number,
    previousSalesCount: number,
  ): HealthScore {
    const lastLoginAt = org.users[0]?.lastLoginAt ?? null;
    const daysSinceLogin = lastLoginAt
      ? Math.floor((now.getTime() - lastLoginAt.getTime()) / DAY_IN_MS)
      : null;

    // 1. Login recency factor
    let loginRecency: HealthScoreLevel = 'green';
    if (daysSinceLogin === null || daysSinceLogin > 30) {
      loginRecency = 'red';
    } else if (daysSinceLogin > 14) {
      loginRecency = 'orange';
    }

    // 2. Activity level factor (based on recent sales)
    let activityLevel: HealthScoreLevel = 'green';
    if (recentSalesCount === 0) {
      // No sales in last 30 days
      activityLevel = org.subscriptions.length > 0 ? 'orange' : 'red';
    }

    // 3. Payment status factor
    let paymentStatus: HealthScoreLevel = 'green';
    if (org.suspendedAt) {
      paymentStatus = 'red';
    } else if (org.platformSubscription?.status === 'PAST_DUE') {
      paymentStatus = 'red';
    } else if (!org.saasActive && org.platformSubscription) {
      paymentStatus = 'orange';
    }

    // 4. Revenue health factor (trend)
    let revenueHealth: HealthScoreLevel = 'green';
    let recentRevenueChange: number | null = null;

    if (previousSalesCount > 0) {
      recentRevenueChange = Math.round(
        ((recentSalesCount - previousSalesCount) / previousSalesCount) * 100,
      );
      if (recentRevenueChange < -50) {
        revenueHealth = 'red';
      } else if (recentRevenueChange < -20) {
        revenueHealth = 'orange';
      }
    } else if (recentSalesCount === 0 && org.subscriptions.length > 0) {
      // Had active subs but no new sales
      revenueHealth = 'orange';
    }

    // Calculate overall score (0-100)
    const factorScores = {
      green: 100,
      orange: 50,
      red: 0,
    };

    const avgScore = Math.round(
      (factorScores[loginRecency] +
        factorScores[activityLevel] +
        factorScores[paymentStatus] +
        factorScores[revenueHealth]) /
        4,
    );

    // Determine overall level
    let level: HealthScoreLevel = 'green';
    if (
      loginRecency === 'red' ||
      paymentStatus === 'red' ||
      (activityLevel === 'red' && revenueHealth === 'red')
    ) {
      level = 'red';
    } else if (
      loginRecency === 'orange' ||
      activityLevel === 'orange' ||
      paymentStatus === 'orange' ||
      revenueHealth === 'orange'
    ) {
      level = 'orange';
    }

    return {
      level,
      score: avgScore,
      factors: {
        loginRecency,
        activityLevel,
        paymentStatus,
        revenueHealth,
      },
      lastLoginAt,
      daysSinceLogin,
      recentSalesCount,
      recentRevenueChange,
    };
  }

  /**
   * Count creators at churn risk (health score red or orange)
   */
  async getChurnRiskCount(): Promise<number> {
    const creators = await this.getCreatorsList();
    return creators.filter(
      (c) =>
        !c.suspendedAt &&
        c.saasActive &&
        (c.healthScore.level === 'red' || c.healthScore.level === 'orange'),
    ).length;
  }

  /**
   * Get detailed information about a specific creator (organization)
   */
  async getCreatorDetail(id: string): Promise<CreatorDetail> {
    const now = new Date();
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_IN_MS);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_IN_MS);

    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: 'ORG_ADMIN' },
          select: { email: true, lastLoginAt: true },
          take: 1,
        },
        channels: {
          select: {
            id: true,
            title: true,
            provider: true,
            type: true,
            isActive: true,
            _count: {
              select: { channelAccesses: { where: { status: 'GRANTED' } } },
            },
          },
        },
        customers: {
          where: { deletedAt: null },
          select: { id: true },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: { id: true, createdAt: true },
        },
        products: {
          select: {
            id: true,
            name: true,
            status: true,
            _count: { select: { plans: true } },
          },
        },
        platformSubscription: {
          select: {
            status: true,
            metadata: true,
            platformPlan: { select: { name: true } },
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            action: true,
            resourceType: true,
            createdAt: true,
            metadata: true,
          },
        },
        paymentEvents: {
          orderBy: { occurredAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            occurredAt: true,
            payload: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Creator not found');
    }

    // Get revenue stats
    const [recentSalesCount, previousSalesCount] = await Promise.all([
      this.prisma.subscription.count({
        where: { organizationId: id, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.subscription.count({
        where: {
          organizationId: id,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
    ]);

    // Calculate revenue from payment events
    const [revenueThisMonth, revenuePreviousMonth] = await Promise.all([
      this.calculateRevenue(id, thirtyDaysAgo, now),
      this.calculateRevenue(id, sixtyDaysAgo, thirtyDaysAgo),
    ]);

    // Total revenue all time
    const totalRevenue = await this.calculateRevenue(id);

    // Calculate payment risk
    let paymentRisk: CreatorListItem['paymentRisk'] = null;
    if (org.platformSubscription?.status === 'PAST_DUE') {
      const metadata =
        (org.platformSubscription.metadata as Record<string, unknown> | null) ??
        {};
      const failedAttempts = (metadata.failedPaymentAttempts as number) ?? 0;
      const firstFailedAt = metadata.firstFailedAt
        ? new Date(metadata.firstFailedAt as string)
        : null;
      const daysOverdue = firstFailedAt
        ? Math.floor((now.getTime() - firstFailedAt.getTime()) / DAY_IN_MS)
        : 0;
      const daysUntilBlock =
        failedAttempts >= 3 ? 0 : Math.max(0, 7 - daysOverdue);
      paymentRisk = {
        isAtRisk: true,
        daysOverdue,
        failedAttempts,
        daysUntilBlock,
      };
    }

    // Calculate health score
    const healthScore = this.calculateHealthScore(
      org,
      now,
      DAY_IN_MS,
      recentSalesCount,
      previousSalesCount,
    );

    // Map channels with access counts
    const channels = org.channels.map((ch) => ({
      id: ch.id,
      title: ch.title,
      provider: ch.provider,
      type: ch.type,
      isActive: ch.isActive,
      accessCount: ch._count.channelAccesses,
    }));

    // Map products with subscription counts
    const productIds = org.products.map((p) => p.id);
    const subscriptionCounts = await this.prisma.subscription.groupBy({
      by: ['planId'],
      where: {
        status: 'ACTIVE',
        plan: { productId: { in: productIds } },
      },
      _count: { id: true },
    });

    const planProductMap = await this.prisma.plan.findMany({
      where: { productId: { in: productIds } },
      select: { id: true, productId: true },
    });

    const productSubCounts = new Map<string, number>();
    for (const sub of subscriptionCounts) {
      const plan = planProductMap.find((p) => p.id === sub.planId);
      if (plan) {
        productSubCounts.set(
          plan.productId,
          (productSubCounts.get(plan.productId) ?? 0) + sub._count.id,
        );
      }
    }

    const products = org.products.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      plansCount: p._count.plans,
      subscriptionsCount: productSubCounts.get(p.id) ?? 0,
    }));

    // Map payment events
    const recentPayments = org.paymentEvents.map((pe) => {
      const payload = pe.payload as { amount_paid?: number; currency?: string };
      return {
        id: pe.id,
        type: pe.type,
        occurredAt: pe.occurredAt,
        amount: payload.amount_paid ?? 0,
        currency: payload.currency ?? 'eur',
      };
    });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      billingEmail: org.billingEmail,
      saasActive: org.saasActive,
      suspendedAt: org.suspendedAt,
      createdAt: org.createdAt,
      ownerEmail: org.users[0]?.email ?? null,
      channelsCount: org.channels.length,
      customersCount: org.customers.length,
      activeSubscriptionsCount: org.subscriptions.length,
      platformPlan: org.platformSubscription?.platformPlan?.name ?? null,
      platformStatus: org.platformSubscription?.status ?? null,
      paymentRisk,
      healthScore,
      // Extended details
      ambassadorTier: org.ambassadorTier,
      ambassadorSince: org.ambassadorSince,
      lastLoyaltyRewardAt: org.lastLoyaltyRewardAt,
      totalRevenue,
      revenueThisMonth,
      revenuePreviousMonth,
      recentActivity: org.auditLogs,
      recentPayments,
      channels,
      products,
    };
  }

  /**
   * Calculate revenue for an organization in a given period
   */
  private async calculateRevenue(
    organizationId: string,
    since?: Date,
    until?: Date,
  ): Promise<number> {
    try {
      const paidInvoices = await this.prisma.paymentEvent.findMany({
        where: {
          organizationId,
          type: PaymentEventType.INVOICE_PAID,
          ...(since && {
            occurredAt: { gte: since, ...(until && { lt: until }) },
          }),
        },
        select: { payload: true },
      });

      let total = 0;
      for (const event of paidInvoices) {
        const payload = event.payload as { amount_paid?: number } | null;
        if (payload?.amount_paid && typeof payload.amount_paid === 'number') {
          total += payload.amount_paid;
        }
      }
      return total;
    } catch {
      return 0;
    }
  }

  /**
   * Universal search across organizations and users
   */
  async search(query: string): Promise<{
    organizations: {
      id: string;
      name: string;
      slug: string;
      billingEmail: string;
    }[];
    users: { id: string; email: string; name: string | null }[];
  }> {
    const [organizations, users] = await Promise.all([
      this.prisma.organization.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { billingEmail: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, slug: true, billingEmail: true },
        take: 10,
      }),
      this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, email: true, firstName: true, lastName: true },
        take: 10,
      }),
    ]);

    return {
      organizations,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || null,
      })),
    };
  }
}
