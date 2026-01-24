"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...\n');
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
    const hashedPassword = await bcrypt.hash('password123', 10);
    const alexPasswordHash = await bcrypt.hash('alexcreateur123', 10);
    const sophiePasswordHash = await bcrypt.hash('sophiefollower123', 10);
    console.log('👤 Creating SUPERADMIN account...');
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@test.com',
            passwordHash: hashedPassword,
            role: client_1.UserRole.SUPERADMIN,
            firstName: 'Admin',
            lastName: 'Super',
            isActive: true,
        },
    });
    console.log(`✅ Admin created: ${adminUser.email} (role: ${adminUser.role})`);
    console.log(`   → Login at /admin with: admin@test.com / password123\n`);
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
    console.log(`✅ Organization created: ${merchantOrg.name} (${merchantOrg.slug})`);
    console.log('👤 Creating ORG_ADMIN account...');
    const merchantUser = await prisma.user.create({
        data: {
            email: 'merchant@test.com',
            passwordHash: hashedPassword,
            role: client_1.UserRole.ORG_ADMIN,
            firstName: 'Merchant',
            lastName: 'Test',
            isActive: true,
            organizationId: merchantOrg.id,
        },
    });
    console.log(`✅ Merchant user created: ${merchantUser.email} (role: ${merchantUser.role})`);
    console.log(`   → Login at /dashboard with: merchant@test.com / password123\n`);
    console.log('👤 Creating Alex ORG_ADMIN account...');
    const alexUser = await prisma.user.create({
        data: {
            email: 'alexcreateur@test.com',
            passwordHash: alexPasswordHash,
            role: client_1.UserRole.ORG_ADMIN,
            firstName: 'Alex',
            lastName: 'Createur',
            isActive: true,
            organizationId: merchantOrg.id,
        },
    });
    console.log(`✅ Alex user created: ${alexUser.email} (role: ${alexUser.role})`);
    console.log(`   → Login at /dashboard with: alexcreateur@test.com / alexcreateur123\n`);
    console.log('👤 Creating Sophie VIEWER account...');
    const sophieUser = await prisma.user.create({
        data: {
            email: 'sophiefollower@test.com',
            passwordHash: sophiePasswordHash,
            role: client_1.UserRole.VIEWER,
            firstName: 'Sophie',
            lastName: 'Follower',
            isActive: true,
            organizationId: merchantOrg.id,
        },
    });
    console.log(`✅ Sophie user created: ${sophieUser.email} (role: ${sophieUser.role})`);
    console.log(`   → Login at /dashboard with: sophiefollower@test.com / sophiefollower123\n`);
    console.log('📦 Creating sample products...');
    const product1 = await prisma.product.create({
        data: {
            organizationId: merchantOrg.id,
            name: 'VIP Telegram Access',
            description: 'Accès exclusif au channel VIP avec contenu premium',
            status: client_1.ProductStatus.ACTIVE,
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
            status: client_1.ProductStatus.ACTIVE,
            metadata: {
                features: ['10 modules vidéo', 'PDF téléchargeables', 'Groupe privé'],
            },
        },
    });
    console.log(`✅ Products created:`);
    console.log(`   - ${product1.name}`);
    console.log(`   - ${product2.name}\n`);
    console.log('💰 Creating sample plans...');
    const plans = await Promise.all([
        prisma.plan.create({
            data: {
                productId: product1.id,
                name: 'Mensuel',
                description: 'Abonnement mensuel au channel VIP',
                interval: client_1.PlanInterval.MONTH,
                priceCents: 2900,
                currency: 'EUR',
                isActive: true,
            },
        }),
        prisma.plan.create({
            data: {
                productId: product1.id,
                name: 'Annuel',
                description: 'Abonnement annuel au channel VIP (2 mois offerts)',
                interval: client_1.PlanInterval.YEAR,
                priceCents: 29000,
                currency: 'EUR',
                trialPeriodDays: 7,
                isActive: true,
            },
        }),
        prisma.plan.create({
            data: {
                productId: product2.id,
                name: 'Accès à vie',
                description: 'Accès illimité à la formation',
                interval: client_1.PlanInterval.ONE_TIME,
                priceCents: 19900,
                currency: 'EUR',
                isActive: true,
            },
        }),
        prisma.plan.create({
            data: {
                productId: product2.id,
                name: 'Accès 30 jours',
                description: 'Accès temporaire de 30 jours',
                interval: client_1.PlanInterval.ONE_TIME,
                priceCents: 4900,
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
    console.log('📋 Creating sample subscriptions...');
    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const subscription1 = await prisma.subscription.create({
        data: {
            organizationId: merchantOrg.id,
            customerId: customers[0].id,
            planId: plans[0].id,
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
            planId: plans[2].id,
            status: 'ACTIVE',
            startedAt: now,
        },
    });
    const subscription3 = await prisma.subscription.create({
        data: {
            organizationId: merchantOrg.id,
            customerId: customers[2].id,
            planId: plans[0].id,
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
//# sourceMappingURL=seed.js.map