"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🔄 Starting migration: Grandfathering existing organizations...\n');
    const grandfatheredPlan = await prisma.platformPlan.findUnique({
        where: { name: 'grandfathered' },
    });
    if (!grandfatheredPlan) {
        console.error('❌ Grandfathered plan not found. Please run the seed first.');
        process.exit(1);
    }
    console.log(`✅ Found grandfathered plan: ${grandfatheredPlan.displayName}\n`);
    const orgsToMigrate = await prisma.organization.findMany({
        where: {
            saasActive: true,
            platformSubscription: null,
        },
        select: {
            id: true,
            name: true,
            slug: true,
            billingEmail: true,
        },
    });
    if (orgsToMigrate.length === 0) {
        console.log('✅ No organizations to migrate. All active orgs already have platform subscriptions.\n');
        return;
    }
    console.log(`📋 Found ${orgsToMigrate.length} organization(s) to migrate:\n`);
    orgsToMigrate.forEach((org) => {
        console.log(`   - ${org.name} (${org.slug})`);
    });
    console.log('');
    let migrated = 0;
    let errors = 0;
    for (const org of orgsToMigrate) {
        try {
            await prisma.platformSubscription.create({
                data: {
                    organizationId: org.id,
                    platformPlanId: grandfatheredPlan.id,
                    status: client_1.PlatformSubscriptionStatus.ACTIVE,
                    stripeSubscriptionId: null,
                    stripeCustomerId: null,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: null,
                    trialEndsAt: null,
                    canceledAt: null,
                    cancelAtPeriodEnd: false,
                    graceUntil: null,
                    metadata: {
                        grandfathered: true,
                        migratedAt: new Date().toISOString(),
                        reason: 'Existing active organization before platform subscription launch',
                        originalSaasActive: true,
                    },
                },
            });
            console.log(`   ✅ Migrated: ${org.name}`);
            migrated++;
        }
        catch (error) {
            console.error(`   ❌ Failed to migrate ${org.name}:`, error);
            errors++;
        }
    }
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MIGRATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total organizations found: ${orgsToMigrate.length}`);
    console.log(`   Successfully migrated:     ${migrated}`);
    console.log(`   Errors:                    ${errors}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    if (errors > 0) {
        console.warn('⚠️  Some organizations failed to migrate. Please check the errors above.');
    }
    else {
        console.log('✅ Migration completed successfully!');
    }
}
main()
    .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=migrate-existing-orgs.js.map