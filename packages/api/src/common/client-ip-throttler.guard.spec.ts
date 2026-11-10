import { Controller, Get } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { getRateLimitTrackers } from './client-ip';
import { ClientIpThrottlerGuard } from './client-ip-throttler.guard';

describe('getRateLimitTrackers', () => {
  it('uses Fly-Client-IP rather than the Fly proxy peer', () => {
    expect(
      getRateLimitTrackers({
        ip: '172.16.0.2',
        headers: { 'fly-client-ip': '203.0.113.7' },
      }),
    ).toEqual(['edge:203.0.113.7']);
  });

  it('adds the Netlify visitor address on top of the edge address', () => {
    expect(
      getRateLimitTrackers({
        ip: '172.16.0.2',
        headers: {
          'fly-client-ip': '198.51.100.20',
          'x-nf-client-connection-ip': '2001:db8::1',
        },
      }),
    ).toEqual(['edge:198.51.100.20', 'visitor:2001:db8::1']);
  });

  it('falls back to the TCP peer off Fly and ignores malformed headers', () => {
    expect(
      getRateLimitTrackers({
        ip: '127.0.0.1',
        headers: {
          'fly-client-ip': 'not-an-ip',
          'x-nf-client-connection-ip': '1.2.3.4, 5.6.7.8',
        },
      }),
    ).toEqual(['edge:127.0.0.1']);
  });
});

@Controller()
class PingController {
  @Get('ping')
  ping() {
    return { ok: true };
  }
}

describe('ClientIpThrottlerGuard', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'medium', ttl: 60_000, limit: 2 }]),
      ],
      controllers: [PingController],
      providers: [{ provide: APP_GUARD, useClass: ClientIpThrottlerGuard }],
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

  const ping = (headers: Record<string, string>) =>
    app.inject({ method: 'GET', url: '/ping', headers });

  it('gives each visitor their own bucket behind the Fly proxy', async () => {
    const alice = { 'fly-client-ip': '203.0.113.1' };
    const bob = { 'fly-client-ip': '203.0.113.2' };

    expect((await ping(alice)).statusCode).toBe(200);
    expect((await ping(alice)).statusCode).toBe(200);
    expect((await ping(alice)).statusCode).toBe(429);
    // Before, every request came from the same proxy peer: Bob was blocked too.
    expect((await ping(bob)).statusCode).toBe(200);
  });

  it('does not let a forged visitor header escape the edge limit', async () => {
    for (const [i, expected] of [200, 200, 429].entries()) {
      const res = await ping({
        'fly-client-ip': '203.0.113.9',
        'x-nf-client-connection-ip': `10.0.0.${i}`,
      });
      expect(res.statusCode).toBe(expected);
    }
  });

  it('limits a Netlify visitor even when Netlify egress rotates', async () => {
    for (const [i, expected] of [200, 200, 429].entries()) {
      const res = await ping({
        'fly-client-ip': `198.51.100.${i}`,
        'x-nf-client-connection-ip': '192.0.2.50',
      });
      expect(res.statusCode).toBe(expected);
    }
  });
});
