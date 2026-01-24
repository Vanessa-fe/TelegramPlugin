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
      saasActive: true,
      timezone: 'Europe/Paris',
    },
    create: {
      name: 'Demo Agency',
      slug: 'demo-agency',
      billingEmail: 'billing@demo-agency.local',
      saasActive: true,
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

  // ========================================
  // CREATE TEST MERCHANT ORGANIZATION
  // ========================================
  const merchantOrg = await prisma.organization.upsert({
    where: { slug: 'test-merchant' },
    update: {
      name: 'Test Merchant Org',
      billingEmail: 'billing@test-merchant.com',
      saasActive: true,
      timezone: 'Europe/Paris',
    },
    create: {
      name: 'Test Merchant Org',
      slug: 'test-merchant',
      billingEmail: 'billing@test-merchant.com',
      saasActive: true,
      timezone: 'Europe/Paris',
      metadata: {
        description: 'Organization de test pour simuler un client merchant',
      },
    },
  });

  const merchantPasswordHash = await bcrypt.hash('password123', 10);
  const alexPasswordHash = await bcrypt.hash('alexcreateur123', 10);
  const sophiePasswordHash = await bcrypt.hash('sophiefollower123', 10);

  // Create merchant user (ORG_ADMIN)
  await prisma.user.upsert({
    where: { email: 'merchant@test.com' },
    update: {
      organizationId: merchantOrg.id,
      isActive: true,
      role: UserRole.ORG_ADMIN,
      passwordHash: merchantPasswordHash,
    },
    create: {
      email: 'merchant@test.com',
      passwordHash: merchantPasswordHash,
      role: UserRole.ORG_ADMIN,
      firstName: 'Merchant',
      lastName: 'Test',
      organization: {
        connect: { id: merchantOrg.id },
      },
    },
  });

  // Create Alex user (ORG_ADMIN)
  await prisma.user.upsert({
    where: { email: 'alexcreateur@test.com' },
    update: {
      organizationId: merchantOrg.id,
      isActive: true,
      role: UserRole.ORG_ADMIN,
      firstName: 'Alex',
      lastName: 'Createur',
      passwordHash: alexPasswordHash,
    },
    create: {
      email: 'alexcreateur@test.com',
      passwordHash: alexPasswordHash,
      role: UserRole.ORG_ADMIN,
      firstName: 'Alex',
      lastName: 'Createur',
      organization: {
        connect: { id: merchantOrg.id },
      },
    },
  });

  // Create Sophie user (VIEWER)
  await prisma.user.upsert({
    where: { email: 'sophiefollower@test.com' },
    update: {
      organizationId: merchantOrg.id,
      isActive: true,
      role: UserRole.VIEWER,
      firstName: 'Sophie',
      lastName: 'Follower',
      passwordHash: sophiePasswordHash,
    },
    create: {
      email: 'sophiefollower@test.com',
      passwordHash: sophiePasswordHash,
      role: UserRole.VIEWER,
      firstName: 'Sophie',
      lastName: 'Follower',
      organization: {
        connect: { id: merchantOrg.id },
      },
    },
  });

  // Create sample products for merchant
  const merchantProduct = await prisma.product.upsert({
    where: {
      organizationId_name: {
        organizationId: merchantOrg.id,
        name: 'VIP Telegram Access',
      },
    },
    update: {
      status: ProductStatus.ACTIVE,
      description: 'Accès exclusif au channel VIP avec contenu premium',
    },
    create: {
      organizationId: merchantOrg.id,
      name: 'VIP Telegram Access',
      description: 'Accès exclusif au channel VIP avec contenu premium',
      status: ProductStatus.ACTIVE,
      metadata: {
        features: ['Accès au channel VIP', 'Support prioritaire', 'Contenu exclusif'],
      },
    },
  });

  // Create sample plans for merchant product
  let merchantPlanMonthly = await prisma.plan.findFirst({
    where: {
      productId: merchantProduct.id,
      name: 'Mensuel',
    },
  });

  if (!merchantPlanMonthly) {
    merchantPlanMonthly = await prisma.plan.create({
      data: {
        productId: merchantProduct.id,
        name: 'Mensuel',
        description: 'Abonnement mensuel au channel VIP',
        interval: PlanInterval.MONTH,
        priceCents: 2900,
        currency: 'EUR',
        isActive: true,
      },
    });
  }

  let merchantPlanAnnual = await prisma.plan.findFirst({
    where: {
      productId: merchantProduct.id,
      name: 'Annuel',
    },
  });

  if (!merchantPlanAnnual) {
    await prisma.plan.create({
      data: {
        productId: merchantProduct.id,
        name: 'Annuel',
        description: 'Abonnement annuel (2 mois offerts)',
        interval: PlanInterval.YEAR,
        priceCents: 29000,
        currency: 'EUR',
        trialPeriodDays: 7,
        isActive: true,
      },
    });
  }

  // Create sample customers for merchant
  await prisma.customer.upsert({
    where: { externalId: 'merchant_cust_1' },
    update: {
      email: 'customer1@example.com',
      displayName: 'Jean Dupont',
      organizationId: merchantOrg.id,
    },
    create: {
      externalId: 'merchant_cust_1',
      organizationId: merchantOrg.id,
      email: 'customer1@example.com',
      displayName: 'Jean Dupont',
      telegramUserId: '123456789',
      telegramUsername: 'jeandupont',
    },
  });

  await prisma.customer.upsert({
    where: { externalId: 'merchant_cust_sophie' },
    update: {
      email: 'sophiefollower@test.com',
      displayName: 'Sophie Follower',
      telegramUsername: 'sophiefollower',
      organizationId: merchantOrg.id,
    },
    create: {
      externalId: 'merchant_cust_sophie',
      organizationId: merchantOrg.id,
      email: 'sophiefollower@test.com',
      displayName: 'Sophie Follower',
      telegramUsername: 'sophiefollower',
    },
  });

  console.info('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.info('📋 TEST ACCOUNTS SUMMARY');
  console.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.info('🔑 ADMIN ACCOUNT (SUPERADMIN)');
  console.info(`   Email:    admin@demo-agency.local`);
  console.info(`   Password: ${DEFAULT_ADMIN_PASSWORD}`);
  console.info('   Access:   /admin (full access to all organizations)\n');
  console.info('🔑 MERCHANT ACCOUNT (ORG_ADMIN)');
  console.info('   Email:    merchant@test.com');
  console.info('   Password: password123');
  console.info('   Access:   /dashboard (manage own organization)');
  console.info('   Org:      Test Merchant Org\n');
  console.info('🔑 ALEX ACCOUNT (ORG_ADMIN)');
  console.info('   Email:    alexcreateur@test.com');
  console.info('   Password: alexcreateur123');
  console.info('   Access:   /dashboard (manage own organization)');
  console.info('   Org:      Test Merchant Org\n');
  console.info('🔑 SOPHIE ACCOUNT (VIEWER)');
  console.info('   Email:    sophiefollower@test.com');
  console.info('   Password: sophiefollower123');
  console.info('   Access:   /dashboard (read-only)');
  console.info('   Org:      Test Merchant Org\n');
  console.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
