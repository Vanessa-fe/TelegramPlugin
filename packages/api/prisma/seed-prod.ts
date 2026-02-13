import { PlanInterval, PrismaClient } from '@prisma/client';
import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
}

function resolveEnvFiles(): string[] {
  const explicit = process.env.ENV_FILE?.trim();
  if (explicit) {
    const cwd = process.cwd();
    const repoRoot = findRepoRoot(cwd);
    const candidates = [
      isAbsolute(explicit) ? explicit : resolve(cwd, explicit),
      isAbsolute(explicit) ? explicit : resolve(repoRoot, explicit),
    ];
    return candidates.filter(existsSync);
  }

  const cwd = process.cwd();
  const repoRoot = findRepoRoot(cwd);
  const isProduction = process.env.NODE_ENV === 'production';
  const preferred = isProduction ? '.env.production' : '.env.local';

  const candidates = [
    resolve(cwd, preferred),
    resolve(repoRoot, preferred),
    resolve(cwd, '.env'),
    resolve(repoRoot, '.env'),
  ];
  return candidates.filter(existsSync);
}

for (const envFile of resolveEnvFiles()) {
  dotenvConfig({ path: envFile, override: false });
}

const prisma = new PrismaClient();

type PlanSeed = {
  name: string;
  displayName: string;
  priceCents: number;
  interval: PlanInterval;
  trialPeriodDays: number | null;
  features: {
    maxProducts: number;
    maxChannels: number;
    description: string;
    takeRatePercent?: number;
  };
  isActive: boolean;
  sortOrder: number;
};

const plans: PlanSeed[] = [
  {
    name: 'grandfathered',
    displayName: 'Grandfathered',
    priceCents: 0,
    interval: PlanInterval.MONTH,
    trialPeriodDays: null,
    features: {
      maxProducts: -1,
      maxChannels: -1,
      description: 'Plan gratuit pour les early adopters',
    },
    isActive: false,
    sortOrder: 0,
  },
  {
    name: 'starter',
    displayName: 'Starter',
    priceCents: 0,
    interval: PlanInterval.MONTH,
    trialPeriodDays: null,
    features: {
      maxProducts: -1,
      maxChannels: -1,
      takeRatePercent: 6,
      description:
        'Fonctionnalités de base (paiement, coupons, affiliés) - 6% par vente + frais Stripe',
    },
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'growth',
    displayName: 'Growth',
    priceCents: 2900,
    interval: PlanInterval.MONTH,
    trialPeriodDays: 14,
    features: {
      maxProducts: -1,
      maxChannels: -1,
      takeRatePercent: 3.5,
      description:
        'Affiliés avancés, analytics, exports, support prioritaire - 3.5% par vente + frais Stripe',
    },
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'pro',
    displayName: 'Pro',
    priceCents: 9900,
    interval: PlanInterval.MONTH,
    trialPeriodDays: 14,
    features: {
      maxProducts: -1,
      maxChannels: -1,
      takeRatePercent: 1.5,
      description:
        'Multi-admin, API/webhooks avancés, branding poussé - 1.5% par vente + frais Stripe',
    },
    isActive: true,
    sortOrder: 3,
  },
];

function getStarterPlanSeed(): PlanSeed {
  const starterPlanSeed = plans.find((plan) => plan.name === 'starter');
  if (!starterPlanSeed) {
    throw new Error('Starter plan seed is missing');
  }
  return starterPlanSeed;
}

async function migrateEarlyAdopterToStarter() {
  const starterPlanSeed = getStarterPlanSeed();
  const [earlyAdopter, starter] = await Promise.all([
    prisma.platformPlan.findUnique({
      where: { name: 'early-adopter' },
    }),
    prisma.platformPlan.findUnique({
      where: { name: 'starter' },
    }),
  ]);

  if (!earlyAdopter) {
    return;
  }

  if (starter) {
    const moved = await prisma.platformSubscription.updateMany({
      where: { platformPlanId: earlyAdopter.id },
      data: { platformPlanId: starter.id },
    });

    await prisma.platformPlan.delete({
      where: { id: earlyAdopter.id },
    });

    console.log(
      `↪ Migrated ${moved.count} subscription(s) from early-adopter to starter`,
    );
    return;
  }

  await prisma.platformPlan.update({
    where: { id: earlyAdopter.id },
    data: {
      name: starterPlanSeed.name,
      displayName: starterPlanSeed.displayName,
      priceCents: starterPlanSeed.priceCents,
      currency: 'eur',
      interval: starterPlanSeed.interval,
      trialPeriodDays: starterPlanSeed.trialPeriodDays,
      stripePriceId: null,
      features: starterPlanSeed.features,
      isActive: starterPlanSeed.isActive,
      sortOrder: starterPlanSeed.sortOrder,
    },
  });

  console.log('↪ Renamed early-adopter plan to starter');
}

async function upsertPlan(plan: PlanSeed) {
  const existing = await prisma.platformPlan.findUnique({
    where: { name: plan.name },
  });

  if (!existing) {
    const created = await prisma.platformPlan.create({
      data: {
        name: plan.name,
        displayName: plan.displayName,
        priceCents: plan.priceCents,
        currency: 'eur',
        interval: plan.interval,
        trialPeriodDays: plan.trialPeriodDays,
        stripePriceId: null,
        features: plan.features,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
      },
    });

    console.log(`✅ ${created.displayName} (${created.name})`);
    return;
  }

  const priceConfigChanged =
    existing.priceCents !== plan.priceCents ||
    existing.currency.toLowerCase() !== 'eur' ||
    existing.interval !== plan.interval;

  const updated = await prisma.platformPlan.update({
    where: { id: existing.id },
    data: {
      displayName: plan.displayName,
      priceCents: plan.priceCents,
      currency: 'eur',
      interval: plan.interval,
      trialPeriodDays: plan.trialPeriodDays,
      features: plan.features,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      ...(priceConfigChanged ? { stripePriceId: null } : {}),
    },
  });

  if (priceConfigChanged) {
    console.log(
      `✅ ${updated.displayName} (${updated.name}) [price config changed, Stripe price reset]`,
    );
  } else {
    console.log(`✅ ${updated.displayName} (${updated.name})`);
  }
}

async function main() {
  console.log('🌱 Seeding production platform plans...\n');

  await migrateEarlyAdopterToStarter();

  for (const plan of plans) {
    await upsertPlan(plan);
  }

  console.log('\n✅ Production seed complete.');
}

main()
  .catch((error) => {
    console.error('❌ Production seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
