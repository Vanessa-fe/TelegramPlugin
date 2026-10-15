import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

/**
 * Requests sent by the Telegram bot carry TELEGRAM_STARS_WEBHOOK_SECRET in
 * the x-telegram-stars-secret header. Required in production; optional in dev.
 */
export function assertTelegramBotSecret(
  config: ConfigService,
  secret: string | undefined,
): void {
  const expectedSecret = config.get<string>('TELEGRAM_STARS_WEBHOOK_SECRET');
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  if (isProduction && !expectedSecret) {
    throw new UnauthorizedException(
      'TELEGRAM_STARS_WEBHOOK_SECRET must be configured in production',
    );
  }

  if (expectedSecret && secret !== expectedSecret) {
    throw new UnauthorizedException('Invalid Telegram Stars secret');
  }
}
