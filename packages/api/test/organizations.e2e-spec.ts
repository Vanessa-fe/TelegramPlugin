import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { UserRole } from '@prisma/client';
import { cleanDatabase, disconnectDatabase } from './utils/database';
import { createUser, createOrganization } from './utils/factories';
import { createTestApp } from './utils/app';

describe('Organizations (e2e)', () => {
  let app: NestFastifyApplication;
  let superadminCookies: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create superadmin and login
    await createUser({
      email: 'admin@example.com',
      password: 'Admin1234!',
      role: UserRole.SUPERADMIN,
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'admin@example.com',
        password: 'Admin1234!',
      },
    });

    superadminCookies = loginResponse.cookies
      .map((c: any) => `${c.name}=${c.value}`)
      .join('; ');
  });

  afterAll(async () => {
    await disconnectDatabase();
    await app.close();
  });

  describe('GET /organizations', () => {
    it('should return all organizations for superadmin', async () => {
      await createOrganization({ name: 'Org 1' });
      await createOrganization({ name: 'Org 2' });

      const response = await app.inject({
        method: 'GET',
        url: '/organizations',
        headers: {
          cookie: superadminCookies,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(2);
      expect(body[0].name).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/organizations',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return empty array if no organizations exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/organizations',
        headers: {
          cookie: superadminCookies,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual([]);
    });
  });

  describe('POST /organizations', () => {
    it('should create an organization', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/organizations',
        headers: {
          cookie: superadminCookies,
        },
        payload: {
          name: 'New Org',
          slug: 'new-org',
          billingEmail: 'billing@neworg.com',
          timezone: 'Europe/Paris',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('New Org');
      expect(body.slug).toBe('new-org');
      expect(body.timezone).toBe('Europe/Paris');
    });

    it('should fail with invalid slug', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/organizations',
        headers: {
          cookie: superadminCookies,
        },
        payload: {
          name: 'Bad Org',
          slug: 'Bad Slug!',
          billingEmail: 'billing@badorg.com',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/organizations',
        headers: {
          cookie: superadminCookies,
        },
        payload: {
          name: 'Test Org',
          slug: 'test-org',
          billingEmail: 'invalid-email',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/organizations',
        payload: {
          name: 'New Org',
          slug: 'new-org',
          billingEmail: 'billing@neworg.com',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should use default timezone UTC if not provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/organizations',
        headers: {
          cookie: superadminCookies,
        },
        payload: {
          name: 'New Org',
          slug: 'new-org',
          billingEmail: 'billing@neworg.com',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.timezone).toBe('UTC');
    });
  });

  describe('GET /organizations/:id', () => {
    it('should return organization details', async () => {
      const org = await createOrganization({ name: 'Test Org' });

      const response = await app.inject({
        method: 'GET',
        url: `/organizations/${org.id}`,
        headers: {
          cookie: superadminCookies,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Test Org');
      expect(body.id).toBe(org.id);
    });

    it('should fail if organization not found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/organizations/00000000-0000-0000-0000-000000000000',
        headers: {
          cookie: superadminCookies,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should fail without authentication', async () => {
      const org = await createOrganization({ name: 'Test Org' });

      const response = await app.inject({
        method: 'GET',
        url: `/organizations/${org.id}`,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /organizations/:id', () => {
    it('should update an organization', async () => {
      const org = await createOrganization({ name: 'Old Name' });

      const response = await app.inject({
        method: 'PATCH',
        url: `/organizations/${org.id}`,
        headers: {
          cookie: superadminCookies,
        },
        payload: {
          name: 'New Name',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('New Name');
      expect(body.id).toBe(org.id);
    });

    it('should update multiple fields', async () => {
      const org = await createOrganization({
        name: 'Old Name',
        billingEmail: 'old@test.com',
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/organizations/${org.id}`,
        headers: {
          cookie: superadminCookies,
        },
        payload: {
          name: 'New Name',
          billingEmail: 'new@test.com',
          timezone: 'America/New_York',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('New Name');
      expect(body.billingEmail).toBe('new@test.com');
      expect(body.timezone).toBe('America/New_York');
    });

    it('should fail if organization not found', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/organizations/00000000-0000-0000-0000-000000000000',
        headers: {
          cookie: superadminCookies,
        },
        payload: {
          name: 'New Name',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should fail with invalid email', async () => {
      const org = await createOrganization({ name: 'Test Org' });

      const response = await app.inject({
        method: 'PATCH',
        url: `/organizations/${org.id}`,
        headers: {
          cookie: superadminCookies,
        },
        payload: {
          billingEmail: 'invalid-email',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail without authentication', async () => {
      const org = await createOrganization({ name: 'Test Org' });

      const response = await app.inject({
        method: 'PATCH',
        url: `/organizations/${org.id}`,
        payload: {
          name: 'New Name',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
