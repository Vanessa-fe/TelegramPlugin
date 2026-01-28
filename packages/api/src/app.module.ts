import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentEventsModule } from './modules/payment-events/payment-events.module';
import { ProductsModule } from './modules/products/products.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { StripeWebhookModule } from './modules/payments/stripe-webhook.module';
import { TelegramStarsModule } from './modules/payments/telegram-stars.module';
import { BillingModule } from './modules/billing/billing.module';
import { PlatformSubscriptionModule } from './modules/platform-subscription/platform-subscription.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PlansModule } from './modules/plans/plans.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { ChannelAccessModule } from './modules/channel-access/channel-access.module';
import { EntitlementsModule } from './modules/entitlements/entitlements.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { StorefrontModule } from './modules/storefront/storefront.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { DataExportsModule } from './modules/data-exports/data-exports.module';
import { MetricsModule } from './modules/metrics/metrics.module';

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
    const envPath = isAbsolute(explicit)
      ? explicit
      : resolve(findRepoRoot(process.cwd()), explicit);
    return existsSync(envPath) ? [envPath] : [envPath];
  }

  const cwd = process.cwd();
  const repoRoot = findRepoRoot(cwd);
  const isProduction = process.env.NODE_ENV === 'production';
  const preferredName = isProduction ? '.env.production' : '.env.local';

  const candidates = [
    resolve(cwd, preferredName),
    resolve(repoRoot, preferredName),
    resolve(cwd, '.env'),
    resolve(repoRoot, '.env'),
  ];

  const preferred = candidates.slice(0, 2).filter(existsSync);
  if (preferred.length > 0) {
    return [...new Set(preferred)];
  }
  const fallback = candidates.slice(2).filter(existsSync);
  return [...new Set(fallback)];
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: resolveEnvFiles(),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
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
    PrismaModule,
    OrganizationsModule,
    ProductsModule,
    PlansModule,
    CustomersModule,
    SubscriptionsModule,
    PaymentEventsModule,
    ChannelsModule,
    ChannelAccessModule,
    EntitlementsModule,
    AuthModule,
    StripeWebhookModule,
    TelegramStarsModule,
    BillingModule,
    PlatformSubscriptionModule,
    StorefrontModule,
    SchedulerModule,
    DataExportsModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
