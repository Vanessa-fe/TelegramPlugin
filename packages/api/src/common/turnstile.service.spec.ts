import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TurnstileService } from './turnstile.service';

function makeService(secret?: string) {
  return new TurnstileService({
    get: (key: string) => (key === 'TURNSTILE_SECRET_KEY' ? secret : undefined),
  } as unknown as ConfigService);
}

function mockSiteverify(body: unknown, ok = true) {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(body),
  } as Response);
}

describe('TurnstileService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('lets everything through while no secret is configured', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const service = makeService(undefined);

    expect(service.enabled).toBe(false);
    await expect(
      service.assertHuman(undefined, 'contact'),
    ).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a missing token without calling Cloudflare', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    await expect(
      makeService('secret').assertHuman(undefined, 'contact'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends the secret and token to siteverify and accepts a success', async () => {
    const fetchSpy = mockSiteverify({ success: true, action: 'contact' });

    await makeService('secret').assertHuman('tok', 'contact');

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    );
    const params = init?.body as URLSearchParams;
    expect(params.get('secret')).toBe('secret');
    expect(params.get('response')).toBe('tok');
  });

  it('rejects a token Cloudflare refuses', async () => {
    mockSiteverify({
      success: false,
      'error-codes': ['invalid-input-response'],
    });

    await expect(
      makeService('secret').assertHuman('tok', 'contact'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a token issued for another form', async () => {
    mockSiteverify({ success: true, action: 'register' });

    await expect(
      makeService('secret').assertHuman('tok', 'contact'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports Cloudflare outages as temporary', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNRESET'));

    await expect(
      makeService('secret').assertHuman('tok', 'contact'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
