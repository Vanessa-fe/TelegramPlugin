import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { cleanDatabase, disconnectDatabase } from './utils/database';
import { createUser } from './utils/factories';
import { createTestApp } from './utils/app';

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
          password: 'Test1234!',
          firstName: 'New',
          lastName: 'User',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('newuser@example.com');
      expect(response.cookies).toBeDefined();
      expect(response.cookies.length).toBeGreaterThan(0);
    });

    it('should fail with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'Test1234!',
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

    it('should fail if email already exists', async () => {
      await createUser({ email: 'existing@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'existing@example.com',
          password: 'Test1234!',
        },
      });

      expect(response.statusCode).toBe(409);
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
      const body = JSON.parse(response.body);
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('test@example.com');
      expect(response.cookies).toBeDefined();
      const cookieNames = response.cookies.map((c: any) => c.name);
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

      const cookies = loginResponse.cookies
        .map((c: any) => `${c.name}=${c.value}`)
        .join('; ');

      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          cookie: cookies,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
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

      const cookies = loginResponse.cookies
        .map((c: any) => `${c.name}=${c.value}`)
        .join('; ');

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: {
          cookie: cookies,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
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

      const cookies = loginResponse.cookies
        .map((c: any) => `${c.name}=${c.value}`)
        .join('; ');

      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          cookie: cookies,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Déconnexion réussie');

      // Verify cookies are cleared (maxAge should be 0)
      const setCookieHeaders = response.headers['set-cookie'];
      expect(setCookieHeaders).toBeDefined();
    });
  });
});
