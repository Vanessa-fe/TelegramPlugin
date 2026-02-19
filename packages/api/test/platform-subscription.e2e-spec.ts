import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PlatformSubscriptionStatus } from '@prisma/client';
import { cleanDatabase, disconnectDatabase, prisma } from './utils/database';
import { createUser, createOrganization } from './utils/factories';
import { createTestApp } from './utils/app';

describe('Platform Subscription (e2e)', () => {
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

  async function loginUser(email: string, password: string) {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });

    return response.cookies.map((c: any) => `${c.name}=${c.value}`).join('; ');
  }

  async function createPlatformPlan(name: string, priceCents: number) {
    return prisma.platformPlan.create({
      data: {
        name,
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
        priceCents,
        currency: 'eur',
        isActive: true,
        sortOrder: name === 'starter' ? 1 : name === 'growth' ? 2 : 3,
      },
    });
  }

  async function createPlatformSubscription(
    organizationId: string,
    platformPlanId: string,
    status: PlatformSubscriptionStatus = PlatformSubscriptionStatus.ACTIVE,
  ) {
    return prisma.platformSubscription.create({
      data: {
        organizationId,
        platformPlanId,
        status,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  describe('GET /platform/plans', () => {
    it('should return available platform plans (public)', async () => {
      await createPlatformPlan('starter', 0);
      await createPlatformPlan('growth', 2900);
      await createPlatformPlan('pro', 9900);

      const response = await app.inject({
        method: 'GET',
        url: '/platform/plans',
      });

      expect(response.statusCode).toBe(200);
      const plans = JSON.parse(response.body);
      expect(plans).toHaveLength(3);
      expect(plans.map((p: any) => p.name)).toEqual(
        expect.arrayContaining(['starter', 'growth', 'pro']),
      );
    });
  });

  describe('GET /platform/subscription', () => {
    it('should return subscription for authenticated user', async () => {
      const org = await createOrganization({ saasActive: true });
      await createUser({
        email: 'test@example.com',
        password: 'Test1234!',
        organizationId: org.id,
        role: 'ORG_ADMIN',
      });

      const growthPlan = await createPlatformPlan('growth', 2900);
      await createPlatformSubscription(org.id, growthPlan.id);

      const cookies = await loginUser('test@example.com', 'Test1234!');

      const response = await app.inject({
        method: 'GET',
        url: '/platform/subscription',
        headers: { cookie: cookies },
      });

      expect(response.statusCode).toBe(200);
      const subscription = JSON.parse(response.body);
      expect(subscription.status).toBe('ACTIVE');
      expect(subscription.plan.name).toBe('growth');
    });

    it('should return null if no subscription', async () => {
      const org = await createOrganization();
      await createUser({
        email: 'test@example.com',
        password: 'Test1234!',
        organizationId: org.id,
        role: 'ORG_ADMIN',
      });

      const cookies = await loginUser('test@example.com', 'Test1234!');

      const response = await app.inject({
        method: 'GET',
        url: '/platform/subscription',
        headers: { cookie: cookies },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toBeNull();
    });
  });

  describe('Plan-based feature restrictions', () => {
    describe('Coupons access', () => {
      it('should deny access to coupons for starter plan', async () => {
        const org = await createOrganization({ saasActive: true });
        await createUser({
          email: 'starter@example.com',
          password: 'Test1234!',
          organizationId: org.id,
          role: 'ORG_ADMIN',
        });

        const starterPlan = await createPlatformPlan('starter', 0);
        await createPlatformSubscription(org.id, starterPlan.id);

        const cookies = await loginUser('starter@example.com', 'Test1234!');

        const response = await app.inject({
          method: 'GET',
          url: '/coupons',
          headers: { cookie: cookies },
        });

        expect(response.statusCode).toBe(403);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('growth ou pro');
      });

      it('should allow access to coupons for growth plan', async () => {
        const org = await createOrganization({ saasActive: true });
        await createUser({
          email: 'growth@example.com',
          password: 'Test1234!',
          organizationId: org.id,
          role: 'ORG_ADMIN',
        });

        const growthPlan = await createPlatformPlan('growth', 2900);
        await createPlatformSubscription(org.id, growthPlan.id);

        const cookies = await loginUser('growth@example.com', 'Test1234!');

        const response = await app.inject({
          method: 'GET',
          url: '/coupons',
          headers: { cookie: cookies },
        });

        expect(response.statusCode).toBe(200);
      });

      it('should allow access to coupons for pro plan', async () => {
        const org = await createOrganization({ saasActive: true });
        await createUser({
          email: 'pro@example.com',
          password: 'Test1234!',
          organizationId: org.id,
          role: 'ORG_ADMIN',
        });

        const proPlan = await createPlatformPlan('pro', 9900);
        await createPlatformSubscription(org.id, proPlan.id);

        const cookies = await loginUser('pro@example.com', 'Test1234!');

        const response = await app.inject({
          method: 'GET',
          url: '/coupons',
          headers: { cookie: cookies },
        });

        expect(response.statusCode).toBe(200);
      });
    });

    describe('Affiliates access', () => {
      it('should deny access to affiliates for starter plan', async () => {
        const org = await createOrganization({ saasActive: true });
        await createUser({
          email: 'starter@example.com',
          password: 'Test1234!',
          organizationId: org.id,
          role: 'ORG_ADMIN',
        });

        const starterPlan = await createPlatformPlan('starter', 0);
        await createPlatformSubscription(org.id, starterPlan.id);

        const cookies = await loginUser('starter@example.com', 'Test1234!');

        const response = await app.inject({
          method: 'GET',
          url: '/affiliates',
          headers: { cookie: cookies },
        });

        expect(response.statusCode).toBe(403);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('growth ou pro');
      });

      it('should allow access to affiliates for growth plan', async () => {
        const org = await createOrganization({ saasActive: true });
        await createUser({
          email: 'growth@example.com',
          password: 'Test1234!',
          organizationId: org.id,
          role: 'ORG_ADMIN',
        });

        const growthPlan = await createPlatformPlan('growth', 2900);
        await createPlatformSubscription(org.id, growthPlan.id);

        const cookies = await loginUser('growth@example.com', 'Test1234!');

        const response = await app.inject({
          method: 'GET',
          url: '/affiliates',
          headers: { cookie: cookies },
        });

        expect(response.statusCode).toBe(200);
      });
    });

    describe('Public validation endpoints', () => {
      it('should allow public access to coupon validation', async () => {
        const org = await createOrganization({ saasActive: true });
        const growthPlan = await createPlatformPlan('growth', 2900);
        await createPlatformSubscription(org.id, growthPlan.id);

        // Create a product and plan for the coupon validation
        const product = await prisma.product.create({
          data: {
            name: 'Test Product',
            organizationId: org.id,
            status: 'ACTIVE',
          },
        });

        const plan = await prisma.plan.create({
          data: {
            name: 'Test Plan',
            priceCents: 1000,
            currency: 'eur',
            interval: 'MONTH',
            productId: product.id,
            isActive: true,
          },
        });

        // This should not require authentication or plan check
        const response = await app.inject({
          method: 'POST',
          url: '/coupons/validate',
          payload: {
            code: 'INVALID_CODE',
            organizationId: org.id,
            planId: plan.id,
          },
        });

        // Even though coupon doesn't exist, it should return 201 with valid: false
        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.valid).toBe(false);
      });

      it('should allow public access to affiliate validation', async () => {
        const org = await createOrganization({ saasActive: true });

        // This should not require authentication or plan check
        const response = await app.inject({
          method: 'POST',
          url: '/affiliates/validate',
          payload: {
            code: 'INVALID_CODE',
            organizationId: org.id,
          },
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.valid).toBe(false);
      });
    });

    describe('Grandfathered accounts', () => {
      it('should allow grandfathered accounts access to all features', async () => {
        const org = await createOrganization({ saasActive: true });
        await createUser({
          email: 'grandfathered@example.com',
          password: 'Test1234!',
          organizationId: org.id,
          role: 'ORG_ADMIN',
        });

        // Create a grandfathered subscription (no specific plan required)
        const starterPlan = await createPlatformPlan('starter', 0);
        await prisma.platformSubscription.create({
          data: {
            organizationId: org.id,
            platformPlanId: starterPlan.id,
            status: PlatformSubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            metadata: { grandfathered: true },
          },
        });

        const cookies = await loginUser('grandfathered@example.com', 'Test1234!');

        // Should be able to access coupons even on starter plan
        const couponsResponse = await app.inject({
          method: 'GET',
          url: '/coupons',
          headers: { cookie: cookies },
        });

        expect(couponsResponse.statusCode).toBe(200);

        // Should be able to access affiliates even on starter plan
        const affiliatesResponse = await app.inject({
          method: 'GET',
          url: '/affiliates',
          headers: { cookie: cookies },
        });

        expect(affiliatesResponse.statusCode).toBe(200);
      });
    });

    describe('No subscription', () => {
      it('should deny access to coupons without any subscription', async () => {
        const org = await createOrganization();
        await createUser({
          email: 'nosub@example.com',
          password: 'Test1234!',
          organizationId: org.id,
          role: 'ORG_ADMIN',
        });

        const cookies = await loginUser('nosub@example.com', 'Test1234!');

        const response = await app.inject({
          method: 'GET',
          url: '/coupons',
          headers: { cookie: cookies },
        });

        expect(response.statusCode).toBe(403);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('abonnement');
      });
    });
  });
});
