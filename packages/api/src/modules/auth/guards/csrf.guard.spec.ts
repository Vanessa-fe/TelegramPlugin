import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';

function makeContext(
  method: string,
  headers: Record<string, string | undefined>,
): ExecutionContext {
  const request = { method, headers };
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
});
