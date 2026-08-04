import {
  PaymentEventType,
  PaymentProvider,
  PlanInterval,
  PrismaClient,
  ProductStatus,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(process.cwd(), '../..');
const envFile = process.env.ENV_FILE
  ? resolve(repoRoot, process.env.ENV_FILE)
  : resolve(repoRoot, '.env.local');

if (existsSync(envFile)) {
  dotenvConfig({ path: envFile, override: false });
}

function assertLocalDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL est manquante.');
  }

  const hostname = new URL(databaseUrl).hostname;
  const localHosts = new Set([
    'localhost',
    '127.0.0.1',
    'postgres',
    'telegram_plugin_postgres',
  ]);

  if (!localHosts.has(hostname) || process.env.NODE_ENV === 'production') {
    throw new Error(
      `Refus d'ajouter des paiements fictifs sur une base non locale (${hostname}).`,
    );
  }
}

assertLocalDatabase();

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY);

const ids = {
  oneTimePlan: '10000000-0000-4000-8000-000000000001',
  monthlyPlan: '10000000-0000-4000-8000-000000000002',
  oneTimeSubscription: '20000000-0000-4000-8000-000000000001',
  monthlySubscription: '20000000-0000-4000-8000-000000000002',
  failedSubscription: '20000000-0000-4000-8000-000000000003',
  canceledSubscription: '20000000-0000-4000-8000-000000000004',
  refundedSubscription: '20000000-0000-4000-8000-000000000005',
};

async function main(): Promise<void> {
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-paiements' },
    update: {
      name: '[TEST] Démo paiements',
      deletedAt: null,
      suspendedAt: null,
      metadata: { testData: true, fixture: 'payments-demo-v1' },
    },
    create: {
      name: '[TEST] Démo paiements',
      slug: 'demo-paiements',
      billingEmail: 'paiements-demo@sublynk.test',
      currency: 'EUR',
      saasActive: true,
      metadata: { testData: true, fixture: 'payments-demo-v1' },
    },
  });

  await prisma.user.upsert({
    where: { email: 'paiements-demo@sublynk.test' },
    update: {
      organizationId: organization.id,
      role: UserRole.ORG_ADMIN,
      isActive: true,
      lastLoginAt: daysAgo(1),
    },
    create: {
      email: 'paiements-demo@sublynk.test',
      firstName: 'Créateur',
      lastName: 'Démo paiements',
      organizationId: organization.id,
      role: UserRole.ORG_ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: daysAgo(1),
    },
  });

  const product = await prisma.product.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: 'Offres de démonstration',
      },
    },
    update: {
      status: ProductStatus.ACTIVE,
      metadata: { testData: true },
    },
    create: {
      organizationId: organization.id,
      name: 'Offres de démonstration',
      description: 'Produit fictif réservé aux tests du dashboard.',
      status: ProductStatus.ACTIVE,
      metadata: { testData: true },
    },
  });

  const oneTimePlan = await prisma.plan.upsert({
    where: { id: ids.oneTimePlan },
    update: {
      productId: product.id,
      name: 'Accès VIP à vie',
      interval: PlanInterval.ONE_TIME,
      priceCents: 4900,
      currency: 'eur',
      isActive: true,
    },
    create: {
      id: ids.oneTimePlan,
      productId: product.id,
      name: 'Accès VIP à vie',
      interval: PlanInterval.ONE_TIME,
      priceCents: 4900,
      currency: 'eur',
      isActive: true,
      metadata: { testData: true },
    },
  });

  const monthlyPlan = await prisma.plan.upsert({
    where: { id: ids.monthlyPlan },
    update: {
      productId: product.id,
      name: 'Club mensuel',
      interval: PlanInterval.MONTH,
      priceCents: 1900,
      currency: 'eur',
      isActive: true,
    },
    create: {
      id: ids.monthlyPlan,
      productId: product.id,
      name: 'Club mensuel',
      interval: PlanInterval.MONTH,
      priceCents: 1900,
      currency: 'eur',
      isActive: true,
      metadata: { testData: true },
    },
  });

  const customerDefinitions = [
    [
      'fixture-customer-one-time',
      'alice.test@sublynk.test',
      'Alice Achat unique',
    ],
    ['fixture-customer-monthly', 'bruno.test@sublynk.test', 'Bruno Abonné'],
    ['fixture-customer-failed', 'claire.test@sublynk.test', 'Claire Impayé'],
    ['fixture-customer-canceled', 'david.test@sublynk.test', 'David Annulé'],
    ['fixture-customer-refunded', 'emma.test@sublynk.test', 'Emma Remboursée'],
  ] as const;

  const customers = new Map<string, { id: string; email: string | null }>();
  for (const [externalId, email, displayName] of customerDefinitions) {
    const customer = await prisma.customer.upsert({
      where: { externalId },
      update: {
        organizationId: organization.id,
        email,
        displayName,
        deletedAt: null,
        metadata: { testData: true },
      },
      create: {
        organizationId: organization.id,
        externalId,
        email,
        displayName,
        metadata: { testData: true },
      },
    });
    customers.set(externalId, customer);
  }

  const upsertSubscription = async (definition: {
    id: string;
    externalId: string;
    customerKey: string;
    planId: string;
    status: SubscriptionStatus;
    startedAt: Date;
    currentPeriodEnd?: Date;
    canceledAt?: Date;
    lastPaymentFailedAt?: Date;
  }) => {
    const data = {
      organizationId: organization.id,
      customerId: customers.get(definition.customerKey)!.id,
      planId: definition.planId,
      status: definition.status,
      startedAt: definition.startedAt,
      currentPeriodStart: definition.startedAt,
      currentPeriodEnd: definition.currentPeriodEnd ?? null,
      canceledAt: definition.canceledAt ?? null,
      lastPaymentFailedAt: definition.lastPaymentFailedAt ?? null,
      metadata: { testData: true },
    };

    return prisma.subscription.upsert({
      where: { externalId: definition.externalId },
      update: data,
      create: {
        id: definition.id,
        externalId: definition.externalId,
        ...data,
      },
    });
  };

  const oneTimeSubscription = await upsertSubscription({
    id: ids.oneTimeSubscription,
    externalId: 'fixture-sub-one-time',
    customerKey: 'fixture-customer-one-time',
    planId: oneTimePlan.id,
    status: SubscriptionStatus.ACTIVE,
    startedAt: daysAgo(3),
  });
  const monthlySubscription = await upsertSubscription({
    id: ids.monthlySubscription,
    externalId: 'fixture-sub-monthly',
    customerKey: 'fixture-customer-monthly',
    planId: monthlyPlan.id,
    status: SubscriptionStatus.ACTIVE,
    startedAt: daysAgo(20),
    currentPeriodEnd: daysFromNow(28),
  });
  const failedSubscription = await upsertSubscription({
    id: ids.failedSubscription,
    externalId: 'fixture-sub-failed',
    customerKey: 'fixture-customer-failed',
    planId: monthlyPlan.id,
    status: SubscriptionStatus.PAST_DUE,
    startedAt: daysAgo(35),
    currentPeriodEnd: daysAgo(1),
    lastPaymentFailedAt: daysAgo(1),
  });
  const canceledSubscription = await upsertSubscription({
    id: ids.canceledSubscription,
    externalId: 'fixture-sub-canceled',
    customerKey: 'fixture-customer-canceled',
    planId: monthlyPlan.id,
    status: SubscriptionStatus.CANCELED,
    startedAt: daysAgo(25),
    currentPeriodEnd: daysAgo(4),
    canceledAt: daysAgo(4),
  });
  const refundedSubscription = await upsertSubscription({
    id: ids.refundedSubscription,
    externalId: 'fixture-sub-refunded',
    customerKey: 'fixture-customer-refunded',
    planId: oneTimePlan.id,
    status: SubscriptionStatus.EXPIRED,
    startedAt: daysAgo(7),
  });

  const stripeEvent = (
    id: string,
    type: string,
    object: Prisma.InputJsonObject,
  ): Prisma.InputJsonObject => ({
    id,
    object: 'event',
    type,
    account: 'acct_fixture_payments_demo',
    data: { object },
    livemode: false,
  });

  const eventDefinitions = [
    {
      externalId: 'evt_fixture_checkout_one_time',
      subscriptionId: oneTimeSubscription.id,
      type: PaymentEventType.CHECKOUT_COMPLETED,
      occurredAt: daysAgo(3),
      payload: stripeEvent(
        'evt_fixture_checkout_one_time',
        'checkout.session.completed',
        {
          id: 'cs_fixture_one_time',
          mode: 'payment',
          payment_status: 'paid',
          amount_total: 4900,
          currency: 'eur',
          customer_details: {
            email: customers.get('fixture-customer-one-time')!.email,
            name: 'Alice Achat unique',
          },
        },
      ),
    },
    {
      externalId: 'evt_fixture_invoice_subscription_create',
      subscriptionId: monthlySubscription.id,
      type: PaymentEventType.INVOICE_PAID,
      occurredAt: daysAgo(20),
      payload: stripeEvent(
        'evt_fixture_invoice_subscription_create',
        'invoice.payment_succeeded',
        {
          id: 'in_fixture_subscription_create',
          billing_reason: 'subscription_create',
          amount_paid: 1900,
          currency: 'eur',
          customer_email: customers.get('fixture-customer-monthly')!.email,
          customer_name: 'Bruno Abonné',
        },
      ),
    },
    {
      externalId: 'evt_fixture_invoice_renewal',
      subscriptionId: monthlySubscription.id,
      type: PaymentEventType.INVOICE_PAID,
      occurredAt: daysAgo(2),
      payload: stripeEvent(
        'evt_fixture_invoice_renewal',
        'invoice.payment_succeeded',
        {
          id: 'in_fixture_renewal',
          billing_reason: 'subscription_cycle',
          amount_paid: 1900,
          currency: 'eur',
          customer_email: customers.get('fixture-customer-monthly')!.email,
          customer_name: 'Bruno Abonné',
        },
      ),
    },
    {
      externalId: 'evt_fixture_invoice_failed',
      subscriptionId: failedSubscription.id,
      type: PaymentEventType.INVOICE_PAYMENT_FAILED,
      occurredAt: daysAgo(1),
      payload: stripeEvent(
        'evt_fixture_invoice_failed',
        'invoice.payment_failed',
        {
          id: 'in_fixture_failed',
          billing_reason: 'subscription_cycle',
          amount_due: 1900,
          currency: 'eur',
          customer_email: customers.get('fixture-customer-failed')!.email,
          customer_name: 'Claire Impayé',
        },
      ),
    },
    {
      externalId: 'evt_fixture_subscription_canceled',
      subscriptionId: canceledSubscription.id,
      type: PaymentEventType.SUBSCRIPTION_CANCELED,
      occurredAt: daysAgo(4),
      payload: stripeEvent(
        'evt_fixture_subscription_canceled',
        'customer.subscription.deleted',
        {
          id: 'sub_fixture_canceled',
          status: 'canceled',
        },
      ),
    },
    {
      externalId: 'evt_fixture_checkout_refunded',
      subscriptionId: refundedSubscription.id,
      type: PaymentEventType.CHECKOUT_COMPLETED,
      occurredAt: daysAgo(7),
      payload: stripeEvent(
        'evt_fixture_checkout_refunded',
        'checkout.session.completed',
        {
          id: 'cs_fixture_refunded',
          mode: 'payment',
          payment_status: 'paid',
          amount_total: 4900,
          currency: 'eur',
          customer_details: {
            email: customers.get('fixture-customer-refunded')!.email,
            name: 'Emma Remboursée',
          },
        },
      ),
    },
    {
      externalId: 'evt_fixture_refund',
      subscriptionId: refundedSubscription.id,
      type: PaymentEventType.REFUND_CREATED,
      occurredAt: daysAgo(6),
      payload: stripeEvent('evt_fixture_refund', 'charge.refunded', {
        id: 'ch_fixture_refunded',
        amount_refunded: 4900,
        currency: 'eur',
      }),
    },
  ];

  for (const event of eventDefinitions) {
    await prisma.paymentEvent.upsert({
      where: {
        provider_externalId: {
          provider: PaymentProvider.STRIPE,
          externalId: event.externalId,
        },
      },
      update: {
        organizationId: organization.id,
        subscriptionId: event.subscriptionId,
        type: event.type,
        payload: event.payload,
        occurredAt: event.occurredAt,
        processedAt: event.occurredAt,
      },
      create: {
        organizationId: organization.id,
        subscriptionId: event.subscriptionId,
        provider: PaymentProvider.STRIPE,
        externalId: event.externalId,
        type: event.type,
        payload: event.payload,
        occurredAt: event.occurredAt,
        processedAt: event.occurredAt,
      },
    });
  }

  console.info('✅ Paiements fictifs ajoutés à la base locale.');
  console.info(`   Organisation : ${organization.name}`);
  console.info('   2 achats uniques (dont 1 remboursé)');
  console.info('   1 nouvel abonnement + 1 renouvellement');
  console.info('   1 paiement échoué, 1 annulation et 1 remboursement');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
