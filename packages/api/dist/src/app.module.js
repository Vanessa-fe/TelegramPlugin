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
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const payment_events_module_1 = require("./modules/payment-events/payment-events.module");
const products_module_1 = require("./modules/products/products.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const stripe_webhook_module_1 = require("./modules/payments/stripe-webhook.module");
const billing_module_1 = require("./modules/billing/billing.module");
const organizations_module_1 = require("./modules/organizations/organizations.module");
const prisma_module_1 = require("./prisma/prisma.module");
const customers_module_1 = require("./modules/customers/customers.module");
const plans_module_1 = require("./modules/plans/plans.module");
const auth_module_1 = require("./modules/auth/auth.module");
const jwt_auth_guard_1 = require("./modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("./modules/auth/guards/roles.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
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
            auth_module_1.AuthModule,
            stripe_webhook_module_1.StripeWebhookModule,
            billing_module_1.BillingModule,
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