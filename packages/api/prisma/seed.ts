import {
  PlanInterval,
  PlatformSubscriptionStatus,
  PrismaClient,
  ProductStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing test data...');
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'admin@test.com',
          'merchant@test.com',
          'alexcreateur@test.com',
          'sophiefollower@test.com',
        ],
      },
    },
  });
  await prisma.organization.deleteMany({
    where: {
      slug: {
        in: ['test-merchant-org'],
      },
    },
  });

  // Clean and seed Platform Plans
  console.log('🏷️  Seeding Platform Plans...');
  await prisma.platformPlan.deleteMany({
    where: {
      name: {
        in: ['grandfathered', 'early-adopter', 'pro'],
      },
    },
  });

  const grandfatheredPlan = await prisma.platformPlan.create({
    data: {
      name: 'grandfathered',
      displayName: 'Grandfathered',
      priceCents: 0,
      currency: 'eur',
      interval: PlanInterval.MONTH,
      trialPeriodDays: null,
      stripePriceId: null,
      features: {
        maxProducts: -1,
        maxChannels: -1,
        description: 'Plan gratuit pour les early adopters',
      },
      isActive: false, // Not available for new sign-ups
      sortOrder: 0,
    },
  });

  const earlyAdopterPlan = await prisma.platformPlan.create({
    data: {
      name: 'early-adopter',
      displayName: 'Early Adopter',
      priceCents: 1900, // 19€
      currency: 'eur',
      interval: PlanInterval.MONTH,
      trialPeriodDays: 14,
      stripePriceId: null, // Will be set when Stripe price is created
      features: {
        maxProducts: 10,
        maxChannels: 5,
        description: 'Parfait pour démarrer',
      },
      isActive: true,
      sortOrder: 1,
    },
  });

  const proPlan = await prisma.platformPlan.create({
    data: {
      name: 'pro',
      displayName: 'Pro',
      priceCents: 2900, // 29€
      currency: 'eur',
      interval: PlanInterval.MONTH,
      trialPeriodDays: 14,
      stripePriceId: null, // Will be set when Stripe price is created
      features: {
        maxProducts: -1, // unlimited
        maxChannels: -1, // unlimited
        description: 'Pour les créateurs établis',
      },
      isActive: true,
      sortOrder: 2,
    },
  });

  console.log(`✅ Platform Plans created:`);
  console.log(
    `   - ${grandfatheredPlan.displayName} (${grandfatheredPlan.priceCents / 100}€ - inactive)`,
  );
  console.log(
    `   - ${earlyAdopterPlan.displayName} (${earlyAdopterPlan.priceCents / 100}€)`,
  );
  console.log(`   - ${proPlan.displayName} (${proPlan.priceCents / 100}€)\n`);

  // Password for admin/merchant test accounts: "password123"
  const hashedPassword = await bcrypt.hash('password123', 10);
  const alexPasswordHash = await bcrypt.hash('alexcreateur123', 10);
  const sophiePasswordHash = await bcrypt.hash('sophiefollower123', 10);

  // 1. Create SUPERADMIN account (for you - admin access)
  console.log('👤 Creating SUPERADMIN account...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: hashedPassword,
      role: UserRole.SUPERADMIN,
      firstName: 'Admin',
      lastName: 'Super',
      isActive: true,
    },
  });
  console.log(`✅ Admin created: ${adminUser.email} (role: ${adminUser.role})`);
  console.log(`   → Login at /admin with: admin@test.com / password123\n`);

  // 2. Create Test Merchant Organization
  console.log('🏢 Creating test merchant organization...');
  const merchantOrg = await prisma.organization.create({
    data: {
      name: 'Test Merchant Organization',
      slug: 'test-merchant-org',
      billingEmail: 'billing@test-merchant.com',
      saasActive: true,
      timezone: 'Europe/Paris',
      metadata: {
        description: 'Organization de test pour simuler un client merchant',
      },
    },
  });
  console.log(
    `✅ Organization created: ${merchantOrg.name} (${merchantOrg.slug})`,
  );

  // 2b. Create Platform Subscription for test org (grandfathered)
  console.log('📜 Creating grandfathered platform subscription...');
  const platformSub = await prisma.platformSubscription.create({
    data: {
      organizationId: merchantOrg.id,
      platformPlanId: grandfatheredPlan.id,
      status: PlatformSubscriptionStatus.ACTIVE,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: null, // No end date for grandfathered
      trialEndsAt: null,
      canceledAt: null,
      cancelAtPeriodEnd: false,
      graceUntil: null,
      metadata: {
        grandfathered: true,
        migratedAt: new Date().toISOString(),
        reason: 'Early adopter before platform subscription launch',
      },
    },
  });
  console.log(
    `✅ Platform subscription created: ${platformSub.id} (grandfathered)\n`,
  );

  // 3. Create ORG_ADMIN accounts
  console.log('👤 Creating ORG_ADMIN account...');
  const merchantUser = await prisma.user.create({
    data: {
      email: 'merchant@test.com',
      passwordHash: hashedPassword,
      role: UserRole.ORG_ADMIN,
      firstName: 'Merchant',
      lastName: 'Test',
      isActive: true,
      organizationId: merchantOrg.id,
    },
  });
  console.log(
    `✅ Merchant user created: ${merchantUser.email} (role: ${merchantUser.role})`,
  );
  console.log(
    `   → Login at /dashboard with: merchant@test.com / password123\n`,
  );

  console.log('👤 Creating Alex ORG_ADMIN account...');
  const alexUser = await prisma.user.create({
    data: {
      email: 'alexcreateur@test.com',
      passwordHash: alexPasswordHash,
      role: UserRole.ORG_ADMIN,
      firstName: 'Alex',
      lastName: 'Createur',
      isActive: true,
      organizationId: merchantOrg.id,
    },
  });
  console.log(
    `✅ Alex user created: ${alexUser.email} (role: ${alexUser.role})`,
  );
  console.log(
    `   → Login at /dashboard with: alexcreateur@test.com / alexcreateur123\n`,
  );

  console.log('👤 Creating Sophie VIEWER account...');
  const sophieUser = await prisma.user.create({
    data: {
      email: 'sophiefollower@test.com',
      passwordHash: sophiePasswordHash,
      role: UserRole.VIEWER,
      firstName: 'Sophie',
      lastName: 'Follower',
      isActive: true,
      organizationId: merchantOrg.id,
    },
  });
  console.log(
    `✅ Sophie user created: ${sophieUser.email} (role: ${sophieUser.role})`,
  );
  console.log(
    `   → Login at /dashboard with: sophiefollower@test.com / sophiefollower123\n`,
  );

  // 4. Create sample products for the merchant
  console.log('📦 Creating sample products...');
  const product1 = await prisma.product.create({
    data: {
      organizationId: merchantOrg.id,
      name: 'VIP Telegram Access',
      description: 'Accès exclusif au channel VIP avec contenu premium',
      status: ProductStatus.ACTIVE,
      metadata: {
        features: [
          'Accès au channel VIP',
          'Support prioritaire',
          'Contenu exclusif',
        ],
      },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      organizationId: merchantOrg.id,
      name: 'Formation Trading',
      description: 'Accès à tous les modules de formation trading',
      status: ProductStatus.ACTIVE,
      metadata: {
        features: ['10 modules vidéo', 'PDF téléchargeables', 'Groupe privé'],
      },
    },
  });

  console.log(`✅ Products created:`);
  console.log(`   - ${product1.name}`);
  console.log(`   - ${product2.name}\n`);

  // 5. Create sample plans for products
  console.log('💰 Creating sample plans...');
  const plans = await Promise.all([
    // VIP Telegram Access plans
    prisma.plan.create({
      data: {
        productId: product1.id,
        name: 'Mensuel',
        description: 'Abonnement mensuel au channel VIP',
        interval: PlanInterval.MONTH,
        priceCents: 2900, // 29€
        currency: 'EUR',
        isActive: true,
      },
    }),
    prisma.plan.create({
      data: {
        productId: product1.id,
        name: 'Annuel',
        description: 'Abonnement annuel au channel VIP (2 mois offerts)',
        interval: PlanInterval.YEAR,
        priceCents: 29000, // 290€
        currency: 'EUR',
        trialPeriodDays: 7,
        isActive: true,
      },
    }),
    // Formation Trading plans
    prisma.plan.create({
      data: {
        productId: product2.id,
        name: 'Accès à vie',
        description: 'Accès illimité à la formation',
        interval: PlanInterval.ONE_TIME,
        priceCents: 19900, // 199€
        currency: 'EUR',
        isActive: true,
      },
    }),
    prisma.plan.create({
      data: {
        productId: product2.id,
        name: 'Accès 30 jours',
        description: 'Accès temporaire de 30 jours',
        interval: PlanInterval.ONE_TIME,
        priceCents: 4900, // 49€
        currency: 'EUR',
        accessDurationDays: 30,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Plans created: ${plans.length} plans`);
  plans.forEach((plan) => {
    console.log(`   - ${plan.name} (${plan.priceCents / 100}€)`);
  });
  console.log('');

  // 6. Create sample customers
  console.log('👥 Creating sample customers...');
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        organizationId: merchantOrg.id,
        email: 'customer1@example.com',
        displayName: 'Jean Dupont',
        telegramUserId: '123456789',
        telegramUsername: 'jeandupont',
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: merchantOrg.id,
        email: 'customer2@example.com',
        displayName: 'Marie Martin',
        telegramUserId: '987654321',
        telegramUsername: 'mariemartin',
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: merchantOrg.id,
        email: 'sophiefollower@test.com',
        displayName: 'Sophie Follower',
        telegramUserId: '555666777',
        telegramUsername: 'sophiefollower',
      },
    }),
  ]);

  console.log(`✅ Customers created: ${customers.length} customers`);
  customers.forEach((customer) => {
    console.log(`   - ${customer.displayName} (${customer.email})`);
  });
  console.log('');

  // 7. Create sample subscriptions
  console.log('📋 Creating sample subscriptions...');
  const now = new Date();
  const oneMonthLater = new Date(now);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  const subscription1 = await prisma.subscription.create({
    data: {
      organizationId: merchantOrg.id,
      customerId: customers[0].id,
      planId: plans[0].id, // Mensuel
      status: 'ACTIVE',
      startedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthLater,
    },
  });

  const subscription2 = await prisma.subscription.create({
    data: {
      organizationId: merchantOrg.id,
      customerId: customers[1].id,
      planId: plans[2].id, // Accès à vie
      status: 'ACTIVE',
      startedAt: now,
    },
  });

  const subscription3 = await prisma.subscription.create({
    data: {
      organizationId: merchantOrg.id,
      customerId: customers[2].id,
      planId: plans[0].id, // Mensuel
      status: 'ACTIVE',
      startedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthLater,
    },
  });

  console.log(`✅ Subscriptions created: 3 subscriptions`);
  console.log(`   - Customer 1: Active monthly subscription`);
  console.log(`   - Customer 2: Active lifetime access`);
  console.log(`   - Customer 3: Active monthly subscription\n`);

  console.log('🎉 Seed completed successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TEST ACCOUNTS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🔑 ADMIN ACCOUNT (SUPERADMIN)');
  console.log('   Email:    admin@test.com');
  console.log('   Password: password123');
  console.log('   Access:   /admin (full access to all organizations)');
  console.log('');
  console.log('🔑 MERCHANT ACCOUNT (ORG_ADMIN)');
  console.log('   Email:    merchant@test.com');
  console.log('   Password: password123');
  console.log('   Access:   /dashboard (manage own organization)');
  console.log('   Org:      Test Merchant Organization');
  console.log('');
  console.log('🔑 ALEX ACCOUNT (ORG_ADMIN)');
  console.log('   Email:    alexcreateur@test.com');
  console.log('   Password: alexcreateur123');
  console.log('   Access:   /dashboard (manage own organization)');
  console.log('   Org:      Test Merchant Organization');
  console.log('');
  console.log('🔑 SOPHIE ACCOUNT (VIEWER)');
  console.log('   Email:    sophiefollower@test.com');
  console.log('   Password: sophiefollower123');
  console.log('   Access:   /dashboard (read-only)');
  console.log('   Org:      Test Merchant Organization');
  console.log('');
  console.log('📊 SAMPLE DATA CREATED:');
  console.log(`   - 3 Platform Plans (grandfathered, early-adopter, pro)`);
  console.log(`   - 1 Platform Subscription (grandfathered for test org)`);
  console.log(`   - 2 Products`);
  console.log(`   - 4 Plans (monthly, yearly, lifetime, 30-day)`);
  console.log(`   - 3 Customers`);
  console.log(`   - 3 Active subscriptions`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
