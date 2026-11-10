import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const SITEVERIFY_TIMEOUT_MS = 8000;

type SiteverifyResponse = {
  success: boolean;
  'error-codes'?: string[];
  action?: string;
  hostname?: string;
};

/**
 * Cloudflare Turnstile (anti-bot challenge) verification.
 *
 * Enforced only when TURNSTILE_SECRET_KEY is set, so the frontend widget
 * (NEXT_PUBLIC_TURNSTILE_SITE_KEY) can ship first. Each token is single-use
 * and expires after 5 minutes.
 */
@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly secretKey: string | undefined;

  constructor(config: ConfigService) {
    this.secretKey = config.get<string>('TURNSTILE_SECRET_KEY')?.trim();
    if (!this.secretKey) {
      this.logger.warn(
        'TURNSTILE_SECRET_KEY not set - public forms are not protected by Turnstile',
      );
    }
  }

  get enabled(): boolean {
    return Boolean(this.secretKey);
  }

  /**
   * Throws BadRequestException when the token is missing or rejected by
   * Cloudflare, ServiceUnavailableException when Cloudflare cannot be reached.
   */
  async assertHuman(
    token: string | undefined,
    expectedAction: string,
  ): Promise<void> {
    if (!this.secretKey) {
      return;
    }
    if (!token) {
      throw new BadRequestException('Vérification anti-robot manquante');
    }

    const body = new URLSearchParams({
      secret: this.secretKey,
      response: token,
    });

    let result: SiteverifyResponse;
    try {
      const response = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      result = (await response.json()) as SiteverifyResponse;
    } catch (error) {
      this.logger.error(
        `Turnstile siteverify unreachable: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'Vérification anti-robot indisponible, réessaie dans un instant',
      );
    }

    // Test keys answer without an action; real widgets echo the one we set.
    const actionMatches = !result.action || result.action === expectedAction;
    if (!result.success || !actionMatches) {
      this.logger.warn(
        `Turnstile rejected a "${expectedAction}" submission: ${
          (result['error-codes'] ?? []).join(',') ||
          `action=${result.action ?? 'none'}`
        }`,
      );
      throw new BadRequestException('Vérification anti-robot échouée');
    }
  }
}
