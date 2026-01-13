import {
  PrismaClient,
  UserRole,
  SubscriptionStatus,
  PlanInterval,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function createUser(data?: {
  email?: string;
  password?: string;
  role?: UserRole;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
}) {
  const passwordHash = await bcrypt.hash(data?.password || 'Test1234!', 10);

  return prisma.user.create({
    data: {
      email: data?.email || `test-${Date.now()}@example.com`,
      passwordHash,
      role: data?.role || UserRole.VIEWER,
      organizationId: data?.organizationId,
      firstName: data?.firstName || 'Test',
      lastName: data?.lastName || 'User',
    },
  });
}

export async function createOrganization(data?: {
  name?: string;
  slug?: string;
  billingEmail?: string;
  timezone?: string;
}) {
  const timestamp = Date.now();
  return prisma.organization.create({
    data: {
      name: data?.name || `Test Org ${timestamp}`,
      slug: data?.slug || `test-org-${timestamp}`,
      billingEmail: data?.billingEmail || `billing-${timestamp}@example.com`,
      timezone: data?.timezone || 'UTC',
    },
  });
}

export async function createProduct(data?: {
  name?: string;
  organizationId?: string;
}) {
  const timestamp = Date.now();
  const org =
    data?.organizationId
      ? { id: data.organizationId }
      : await createOrganization();

  return prisma.product.create({
    data: {
      name: data?.name || `Test Product ${timestamp}`,
      organizationId: org.id,
    },
  });
}

export async function createPlan(data?: {
  name?: string;
  priceCents?: number;
  interval?: PlanInterval;
  productId?: string;
  organizationId?: string;
}) {
  const timestamp = Date.now();
  const product = data?.productId
    ? { id: data.productId }
    : await createProduct({ organizationId: data?.organizationId });

  return prisma.plan.create({
    data: {
      name: data?.name || `Test Plan ${timestamp}`,
      priceCents: data?.priceCents || 999,
      interval: data?.interval || PlanInterval.MONTH,
      currency: 'USD',
      productId: product.id,
    },
  });
}

export async function createChannel(data?: {
  title?: string;
  externalId?: string;
  organizationId?: string;
}) {
  const timestamp = Date.now();
  const org = data?.organizationId
    ? { id: data.organizationId }
    : await createOrganization();

  return prisma.channel.create({
    data: {
      title: data?.title || `Test Channel ${timestamp}`,
      externalId: data?.externalId || `${-1000000000000 - timestamp}`,
      organizationId: org.id,
    },
  });
}

export async function createCustomer(data?: {
  email?: string;
  telegramUserId?: string;
  organizationId?: string;
}) {
  const timestamp = Date.now();
  const org = data?.organizationId
    ? { id: data.organizationId }
    : await createOrganization();

  return prisma.customer.create({
    data: {
      email: data?.email || `customer-${timestamp}@example.com`,
      telegramUserId: data?.telegramUserId || `${timestamp}`,
      organizationId: org.id,
    },
  });
}

export async function createSubscription(data?: {
  customerId?: string;
  planId?: string;
  organizationId?: string;
  status?: SubscriptionStatus;
  externalId?: string;
}) {
  const timestamp = Date.now();
  const org = data?.organizationId
    ? { id: data.organizationId }
    : await createOrganization();

  const customer = data?.customerId
    ? { id: data.customerId }
    : await createCustomer({ organizationId: org.id });

  const plan = data?.planId
    ? { id: data.planId }
    : await createPlan({ organizationId: org.id });

  return prisma.subscription.create({
    data: {
      customerId: customer.id,
      planId: plan.id,
      organizationId: org.id,
      status: data?.status || SubscriptionStatus.ACTIVE,
      externalId: data?.externalId || `sub_${timestamp}`,
    },
  });
}
