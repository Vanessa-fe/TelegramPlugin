const bcrypt = require('bcryptjs');

const {
  AccessStatus,
  AuditActorType,
  ChannelProvider,
  InviteStatus,
  PaymentEventType,
  PaymentProvider,
  PlanInterval,
  ProductStatus,
  SubscriptionStatus,
  UserRole,
  PrismaClient,
} = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe42!';

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-agency' },
    update: {
      name: 'Demo Agency',
      billingEmail: 'billing@demo-agency.local',
      timezone: 'Europe/Paris',
    },
    create: {
      name: 'Demo Agency',
      slug: 'demo-agency',
      billingEmail: 'billing@demo-agency.local',
      timezone: 'Europe/Paris',
      metadata: {
        onboardingChecklist: ['stripe_connected'],
      },
    },
  });

  const adminPasswordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: 'admin@demo-agency.local' },
    update: {
      organizationId: organization.id,
      isActive: true,
      role: UserRole.SUPERADMIN,
      passwordHash: adminPasswordHash,
    },
    create: {
      email: 'admin@demo-agency.local',
      passwordHash: adminPasswordHash,
      role: UserRole.SUPERADMIN,
      firstName: 'Admin',
      lastName: 'Demo',
      organization: {
        connect: { id: organization.id },
      },
    },
  });

  const product = await prisma.product.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: 'Canal Telegram Premium',
      },
    },
    update: {
      status: ProductStatus.ACTIVE,
      description: 'Accès VIP au contenu Telegram et aux lives hebdomadaires.',
    },
    create: {
      organizationId: organization.id,
      name: 'Canal Telegram Premium',
      description: 'Accès VIP au contenu Telegram et aux lives hebdomadaires.',
      status: ProductStatus.ACTIVE,
      metadata: {
        featured: true,
      },
    },
  });

  let plan = await prisma.plan.findFirst({
    where: {
      productId: product.id,
      name: 'Abonnement Mensuel',
    },
  });

  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        productId: product.id,
        name: 'Abonnement Mensuel',
        description: 'Facturation mensuelle, annulation à tout moment.',
        interval: PlanInterval.MONTH,
        priceCents: 1999,
        currency: 'EUR',
        isActive: true,
        metadata: {
          badge: 'Populaire',
        },
      },
    });
  }

  const channel = await prisma.channel.upsert({
    where: {
      organizationId_provider_externalId: {
        organizationId: organization.id,
        provider: ChannelProvider.TELEGRAM,
        externalId: 'demo_telegram_channel',
      },
    },
    update: {
      title: 'Canal VIP Demo',
      username: 'demo_vip_channel',
      inviteLink: 'https://t.me/+demoInviteLink',
      isActive: true,
    },
    create: {
      organizationId: organization.id,
      provider: ChannelProvider.TELEGRAM,
      externalId: 'demo_telegram_channel',
      title: 'Canal VIP Demo',
      username: 'demo_vip_channel',
      inviteLink: 'https://t.me/+demoInviteLink',
      isActive: true,
      metadata: {
        audience: 'Coaching business',
      },
    },
  });

  await prisma.productChannel.upsert({
    where: {
      productId_channelId: {
        productId: product.id,
        channelId: channel.id,
      },
    },
    update: {},
    create: {
      productId: product.id,
      channelId: channel.id,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { externalId: 'cust_demo_1' },
    update: {
      email: 'client.demo+1@example.com',
      displayName: 'Client Demo',
      telegramUsername: 'client_demo',
      organizationId: organization.id,
    },
    create: {
      externalId: 'cust_demo_1',
      organizationId: organization.id,
      email: 'client.demo+1@example.com',
      displayName: 'Client Demo',
      telegramUsername: 'client_demo',
      metadata: {
        acquisitionSource: 'landing_page',
      },
    },
  });

  const subscription = await prisma.subscription.upsert({
    where: { externalId: 'sub_demo_1' },
    update: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    create: {
      externalId: 'sub_demo_1',
      organizationId: organization.id,
      customerId: customer.id,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      metadata: {
        stripePriceId: 'price_demo_monthly',
      },
    },
  });

  let invite = await prisma.telegramInvite.findFirst({
    where: {
      channelId: channel.id,
      inviteLink: 'https://t.me/+demoInviteLink',
    },
  });

  if (!invite) {
    invite = await prisma.telegramInvite.create({
      data: {
        channelId: channel.id,
        inviteLink: 'https://t.me/+demoInviteLink',
        inviteHash: 'demoInviteLink',
        status: InviteStatus.ACTIVE,
        maxUses: 100,
      },
    });
  }

  await prisma.channelAccess.upsert({
    where: {
      subscriptionId_channelId: {
        subscriptionId: subscription.id,
        channelId: channel.id,
      },
    },
    update: {
      status: AccessStatus.GRANTED,
      grantedAt: new Date(),
      inviteId: invite.id,
    },
    create: {
      subscriptionId: subscription.id,
      channelId: channel.id,
      customerId: customer.id,
      status: AccessStatus.GRANTED,
      grantedAt: new Date(),
      inviteId: invite.id,
    },
  });

  await prisma.paymentEvent.upsert({
    where: {
      provider_externalId: {
        provider: PaymentProvider.STRIPE,
        externalId: 'pi_demo_1',
      },
    },
    update: {
      processedAt: new Date(),
      subscriptionId: subscription.id,
    },
    create: {
      organizationId: organization.id,
      subscriptionId: subscription.id,
      provider: PaymentProvider.STRIPE,
      type: PaymentEventType.CHECKOUT_COMPLETED,
      externalId: 'pi_demo_1',
      payload: { demo: true },
      processedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: organization.id,
      actorType: AuditActorType.SYSTEM,
      action: 'seed_initialized',
      resourceType: 'system',
      metadata: {
        message: 'Données seed injectées',
      },
    },
  });

  console.info(
    `🔐 Identifiants admin par défaut: admin@demo-agency.local / ${DEFAULT_ADMIN_PASSWORD}`,
  );
  console.info('✅ Seed Prisma appliqué avec succès.');
}

main()
  .catch((error) => {
    console.error('❌ Seed Prisma échoué:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
