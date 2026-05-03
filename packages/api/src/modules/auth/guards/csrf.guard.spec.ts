import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';

function makeContext(
  method: string,
  headers: Record<string, string | undefined>,
  url = '/api/some-endpoint',
): ExecutionContext {
  const request = { method, headers, url };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('CsrfGuard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows requests when disabled', () => {
    process.env.NODE_ENV = 'development';
    process.env.COOKIE_SAME_SITE_NONE = 'false';

    const guard = new CsrfGuard();
    const context = makeContext('POST', {});

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows safe methods when enabled', () => {
    process.env.NODE_ENV = 'production';
    process.env.COOKIE_SAME_SITE_NONE = 'true';
    process.env.CORS_ORIGIN = 'https://app.example.com';

    const guard = new CsrfGuard();
    const context = makeContext('GET', {});

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects missing origin for state-changing requests when enabled', () => {
    process.env.NODE_ENV = 'production';
    process.env.COOKIE_SAME_SITE_NONE = 'true';
    process.env.CORS_ORIGIN = 'https://app.example.com';

    const guard = new CsrfGuard();
    const context = makeContext('POST', {});

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows whitelisted origin', () => {
    process.env.NODE_ENV = 'production';
    process.env.COOKIE_SAME_SITE_NONE = 'true';
    process.env.CORS_ORIGIN = 'https://app.example.com';

    const guard = new CsrfGuard();
    const context = makeContext('PATCH', { origin: 'https://app.example.com' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects non-whitelisted origin', () => {
    process.env.NODE_ENV = 'production';
    process.env.COOKIE_SAME_SITE_NONE = 'true';
    process.env.CORS_ORIGIN = 'https://app.example.com';

    const guard = new CsrfGuard();
    const context = makeContext('DELETE', { origin: 'https://evil.example' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  describe('webhook route exclusions', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.COOKIE_SAME_SITE_NONE = 'true';
      process.env.CORS_ORIGIN = 'https://app.example.com';
    });

    it('allows POST /webhooks/stripe without Origin (server-to-server)', () => {
      const guard = new CsrfGuard();
      const context = makeContext('POST', {}, '/webhooks/stripe');

      expect(guard.canActivate(context)).toBe(true);
    });

    it('allows POST /payments/telegram-stars/webhook without Origin', () => {
      const guard = new CsrfGuard();
      const context = makeContext(
        'POST',
        {},
        '/payments/telegram-stars/webhook',
      );

      expect(guard.canActivate(context)).toBe(true);
    });

    it('allows POST /payments/telegram-stars/invoice without Origin', () => {
      const guard = new CsrfGuard();
      const context = makeContext(
        'POST',
        {},
        '/payments/telegram-stars/invoice',
      );

      expect(guard.canActivate(context)).toBe(true);
    });

    it('allows POST /payments/telegram-stars/validate-pre-checkout without Origin', () => {
      const guard = new CsrfGuard();
      const context = makeContext(
        'POST',
        {},
        '/payments/telegram-stars/validate-pre-checkout',
      );

      expect(guard.canActivate(context)).toBe(true);
    });

    it('strips query string when matching webhook routes', () => {
      const guard = new CsrfGuard();
      const context = makeContext('POST', {}, '/webhooks/stripe?foo=bar');

      expect(guard.canActivate(context)).toBe(true);
    });

    it('still requires Origin for non-webhook POST routes', () => {
      const guard = new CsrfGuard();
      const context = makeContext('POST', {}, '/api/subscriptions');

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
