import { Controller, Get, Param, Res } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import type { FastifyReply } from 'fastify';
import { LoggerModule } from 'nestjs-pino';
import { Writable } from 'node:stream';
import {
  HTTP_LOG_REDACT_CENSOR,
  HTTP_LOG_REDACT_PATHS,
  redactUrlSecrets,
  serializeLoggedRequest,
} from './http-log-redaction';

interface RequestLog {
  req: {
    method: string;
    url: string;
    query?: Record<string, string>;
    headers: Record<string, string>;
  };
  res: { statusCode: number; headers: Record<string, string> };
}

@Controller()
class FakeController {
  @Get('auth/refresh')
  refresh(@Res() reply: FastifyReply): void {
    void reply
      .header('set-cookie', [
        'accessToken=new-access',
        'refreshToken=new-refresh',
      ])
      .send({ ok: true });
  }

  @Get('team/invites/public/:token')
  invite(@Param('token') token: string) {
    return { token: token.length };
  }
}

describe('HTTP request log redaction', () => {
  let app: NestFastifyApplication;
  let lines: string[];

  beforeEach(async () => {
    lines = [];
    const stream = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        lines.push(chunk.toString());
        callback();
      },
    });

    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot({
          pinoHttp: [
            {
              redact: {
                paths: HTTP_LOG_REDACT_PATHS,
                censor: HTTP_LOG_REDACT_CENSOR,
              },
              serializers: { req: serializeLoggedRequest },
            },
            stream,
          ],
        }),
      ],
      controllers: [FakeController],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  function completedRequestLog(): RequestLog {
    const line = lines.find((l) => l.includes('request completed'));
    expect(line).toBeDefined();
    return JSON.parse(line!) as RequestLog;
  }

  it('redacts credentials from request and response headers', async () => {
    await app.inject({
      method: 'GET',
      url: '/auth/refresh',
      headers: {
        cookie: 'accessToken=old-access; refreshToken=old-refresh',
        authorization: 'Bearer some-jwt',
        'stripe-signature': 't=1,v1=abc',
        'x-telegram-stars-secret': 'bot-secret',
        'user-agent': 'jest',
      },
    });

    const log = completedRequestLog();
    const raw = lines.join('');
    for (const secret of [
      'old-access',
      'old-refresh',
      'some-jwt',
      'v1=abc',
      'bot-secret',
      'new-access',
      'new-refresh',
    ]) {
      expect(raw).not.toContain(secret);
    }
    expect(log.req.headers.cookie).toBe('[Redacted]');
    expect(log.req.headers.authorization).toBe('[Redacted]');
    expect(log.req.headers['stripe-signature']).toBe('[Redacted]');
    expect(log.req.headers['x-telegram-stars-secret']).toBe('[Redacted]');
    expect(log.res.headers['set-cookie']).toBe('[Redacted]');
    // The rest of the request log stays useful
    expect(log.req.method).toBe('GET');
    expect(log.req.url).toBe('/auth/refresh');
    expect(log.req.headers['user-agent']).toBe('jest');
    expect(log.res.statusCode).toBe(200);
  });

  it('redacts the team invite token and OAuth code from the URL', async () => {
    await app.inject({
      method: 'GET',
      url: '/team/invites/public/invite-token-123?code=google-code&state=xyz&lang=fr',
    });

    const log = completedRequestLog();
    expect(lines.join('')).not.toMatch(/invite-token-123|google-code|xyz/);
    expect(log.req.url).toBe(
      '/team/invites/public/[Redacted]?code=[Redacted]&state=[Redacted]&lang=fr',
    );
    expect(log.req.query).toEqual({
      code: '[Redacted]',
      state: '[Redacted]',
      lang: 'fr',
    });
  });
});

describe('redactUrlSecrets', () => {
  it('leaves ordinary URLs untouched', () => {
    expect(redactUrlSecrets('/products?organizationId=abc&limit=10')).toBe(
      '/products?organizationId=abc&limit=10',
    );
  });

  it('does not touch params that merely end with code', () => {
    expect(redactUrlSecrets('/coupons?promocode=SUMMER')).toBe(
      '/coupons?promocode=SUMMER',
    );
  });
});
