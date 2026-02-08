"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const plans = [
    {
        name: 'grandfathered',
        displayName: 'Grandfathered',
        priceCents: 0,
        interval: client_1.PlanInterval.MONTH,
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
        name: 'early-adopter',
        displayName: 'Early Adopter',
        priceCents: 1900,
        interval: client_1.PlanInterval.MONTH,
        trialPeriodDays: 14,
        features: {
            maxProducts: 10,
            maxChannels: 5,
            description: 'Parfait pour démarrer',
        },
        isActive: true,
        sortOrder: 1,
    },
    {
        name: 'pro',
        displayName: 'Pro',
        priceCents: 2900,
        interval: client_1.PlanInterval.MONTH,
        trialPeriodDays: 14,
        features: {
            maxProducts: -1,
            maxChannels: -1,
            description: 'Pour les créateurs établis',
        },
        isActive: true,
        sortOrder: 2,
    },
];
async function main() {
    console.log('🌱 Seeding production platform plans...\n');
    for (const plan of plans) {
        const result = await prisma.platformPlan.upsert({
            where: { name: plan.name },
            create: {
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
            update: {
                displayName: plan.displayName,
                priceCents: plan.priceCents,
                currency: 'eur',
                interval: plan.interval,
                trialPeriodDays: plan.trialPeriodDays,
                features: plan.features,
                isActive: plan.isActive,
                sortOrder: plan.sortOrder,
            },
        });
        console.log(`✅ ${result.displayName} (${result.name})`);
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
//# sourceMappingURL=seed-prod.js.map