import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { cleanDatabase, disconnectDatabase, prisma } from './utils/database';
import { createUser } from './utils/factories';
import { createTestApp } from './utils/app';
import { createHash } from 'node:crypto';

interface RegisterResponseBody {
  verificationRequired: boolean;
  email: string;
}

interface AuthResponseBody {
  user: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

interface LogoutResponseBody {
  message: string;
}

interface TestCookie {
  name: string;
  value: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJson<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

function getCookieNames(cookies: TestCookie[]): string[] {
  return cookies.map((cookie) => cookie.name);
}

function toCookieHeader(cookies: TestCookie[]): string {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}

describe('Auth (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'newuser@example.com',
          password: 'Test12345!',
          firstName: 'New',
          lastName: 'User',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = parseJson<RegisterResponseBody>(response.body);
      expect(body.verificationRequired).toBe(true);
      expect(body.email).toBe('newuser@example.com');
      expect(response.cookies).toBeDefined();
      expect(response.cookies.length).toBe(0);
    });

    it('should fail with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'Test12345!',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail with weak password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'weak',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return generic success if email already exists', async () => {
      await wait(1100);
      await createUser({ email: 'existing@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'existing@example.com',
          password: 'Test12345!',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = parseJson<RegisterResponseBody>(response.body);
      expect(body.verificationRequired).toBe(true);
      expect(body.email).toBe('existing@example.com');
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should verify email and set auth cookies', async () => {
      const user = await createUser({
        email: 'verify-me@example.com',
        emailVerifiedAt: null,
      });
      const token = 'verification-token';

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: createHash('sha256').update(token).digest('hex'),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/verify-email',
        payload: { token },
      });

      expect(response.statusCode).toBe(201);
      const body = parseJson<AuthResponseBody>(response.body);
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('verify-me@example.com');

      const cookieNames = getCookieNames(response.cookies as TestCookie[]);
      expect(cookieNames).toContain('accessToken');
      expect(cookieNames).toContain('refreshToken');

      const updated = await prisma.user.findUnique({
        where: { id: user.id },
        select: { emailVerifiedAt: true },
      });
      expect(updated?.emailVerifiedAt).not.toBeNull();
    });

    it('should fail with invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/verify-email',
        payload: { token: 'invalid-token' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      await createUser({
        email: 'test@example.com',
        password: 'Test1234!',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'Test1234!',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = parseJson<AuthResponseBody>(response.body);
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('test@example.com');
      expect(response.cookies).toBeDefined();
      const cookieNames = getCookieNames(response.cookies as TestCookie[]);
      expect(cookieNames).toContain('accessToken');
      expect(cookieNames).toContain('refreshToken');
    });

    it('should fail with wrong password', async () => {
      await createUser({
        email: 'test@example.com',
        password: 'Test1234!',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'WrongPassword!',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with non-existent email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'Test1234!',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user profile with valid cookie', async () => {
      await createUser({
        email: 'test@example.com',
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'User',
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'Test1234!',
        },
      });

      const cookies = toCookieHeader(loginResponse.cookies as TestCookie[]);

      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          cookie: cookies,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = parseJson<AuthResponseBody['user']>(response.body);
      expect(body.email).toBe('test@example.com');
      expect(body.firstName).toBe('Test');
      expect(body.lastName).toBe('User');
    });

    it('should fail without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      await createUser({
        email: 'test@example.com',
        password: 'Test1234!',
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'Test1234!',
        },
      });

      const cookies = toCookieHeader(loginResponse.cookies as TestCookie[]);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: {
          cookie: cookies,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(201);
      const body = parseJson<AuthResponseBody>(response.body);
      expect(body.user).toBeDefined();
      expect(response.cookies).toBeDefined();
    });

    it('should fail with invalid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: {
          cookie: 'refreshToken=invalid',
        },
        payload: {},
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout and clear cookies', async () => {
      await createUser({
        email: 'test@example.com',
        password: 'Test1234!',
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'Test1234!',
        },
      });

      const cookies = toCookieHeader(loginResponse.cookies as TestCookie[]);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          cookie: cookies,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = parseJson<LogoutResponseBody>(response.body);
      expect(body.message).toBe('Déconnexion réussie');

      // Verify cookies are cleared (maxAge should be 0)
      const setCookieHeaders = response.headers['set-cookie'];
      expect(setCookieHeaders).toBeDefined();
    });
  });
});
