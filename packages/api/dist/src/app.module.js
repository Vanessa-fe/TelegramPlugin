"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const nestjs_pino_1 = require("nestjs-pino");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const payment_events_module_1 = require("./modules/payment-events/payment-events.module");
const products_module_1 = require("./modules/products/products.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const stripe_webhook_module_1 = require("./modules/payments/stripe-webhook.module");
const telegram_stars_module_1 = require("./modules/payments/telegram-stars.module");
const billing_module_1 = require("./modules/billing/billing.module");
const platform_subscription_module_1 = require("./modules/platform-subscription/platform-subscription.module");
const organizations_module_1 = require("./modules/organizations/organizations.module");
const prisma_module_1 = require("./prisma/prisma.module");
const customers_module_1 = require("./modules/customers/customers.module");
const plans_module_1 = require("./modules/plans/plans.module");
const channels_module_1 = require("./modules/channels/channels.module");
const channel_access_module_1 = require("./modules/channel-access/channel-access.module");
const entitlements_module_1 = require("./modules/entitlements/entitlements.module");
const auth_module_1 = require("./modules/auth/auth.module");
const jwt_auth_guard_1 = require("./modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("./modules/auth/guards/roles.guard");
const storefront_module_1 = require("./modules/storefront/storefront.module");
const scheduler_module_1 = require("./modules/scheduler/scheduler.module");
const data_exports_module_1 = require("./modules/data-exports/data-exports.module");
const metrics_module_1 = require("./modules/metrics/metrics.module");
function findRepoRoot(startDir) {
    let dir = startDir;
    while (true) {
        if ((0, node_fs_1.existsSync)((0, node_path_1.resolve)(dir, 'pnpm-workspace.yaml'))) {
            return dir;
        }
        const parent = (0, node_path_1.resolve)(dir, '..');
        if (parent === dir) {
            return startDir;
        }
        dir = parent;
    }
}
function resolveEnvFiles() {
    const explicit = process.env.ENV_FILE?.trim();
    if (explicit) {
        const envPath = (0, node_path_1.isAbsolute)(explicit)
            ? explicit
            : (0, node_path_1.resolve)(findRepoRoot(process.cwd()), explicit);
        return (0, node_fs_1.existsSync)(envPath) ? [envPath] : [envPath];
    }
    const cwd = process.cwd();
    const repoRoot = findRepoRoot(cwd);
    const isProduction = process.env.NODE_ENV === 'production';
    const preferredName = isProduction ? '.env.production' : '.env.local';
    const candidates = [
        (0, node_path_1.resolve)(cwd, preferredName),
        (0, node_path_1.resolve)(repoRoot, preferredName),
        (0, node_path_1.resolve)(cwd, '.env'),
        (0, node_path_1.resolve)(repoRoot, '.env'),
    ];
    const preferred = candidates.slice(0, 2).filter(node_fs_1.existsSync);
    if (preferred.length > 0) {
        return [...new Set(preferred)];
    }
    const fallback = candidates.slice(2).filter(node_fs_1.existsSync);
    return [...new Set(fallback)];
}
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
                envFilePath: resolveEnvFiles(),
            }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    level: process.env.LOG_LEVEL ?? 'info',
                    transport: process.env.NODE_ENV !== 'production'
                        ? {
                            target: 'pino-pretty',
                            options: {
                                colorize: true,
                                singleLine: true,
                            },
                        }
                        : undefined,
                },
            }),
            prisma_module_1.PrismaModule,
            organizations_module_1.OrganizationsModule,
            products_module_1.ProductsModule,
            plans_module_1.PlansModule,
            customers_module_1.CustomersModule,
            subscriptions_module_1.SubscriptionsModule,
            payment_events_module_1.PaymentEventsModule,
            channels_module_1.ChannelsModule,
            channel_access_module_1.ChannelAccessModule,
            entitlements_module_1.EntitlementsModule,
            auth_module_1.AuthModule,
            stripe_webhook_module_1.StripeWebhookModule,
            telegram_stars_module_1.TelegramStarsModule,
            billing_module_1.BillingModule,
            platform_subscription_module_1.PlatformSubscriptionModule,
            storefront_module_1.StorefrontModule,
            scheduler_module_1.SchedulerModule,
            data_exports_module_1.DataExportsModule,
            metrics_module_1.MetricsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map