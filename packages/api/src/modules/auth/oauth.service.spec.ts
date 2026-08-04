import { UserRole } from '@prisma/client';
import { OAuthService } from './oauth.service';

jest.mock('@telegram-plugin/shared', () => ({
  initPostHog: jest.fn(() => null),
  shutdownPostHog: jest.fn(),
  ServerEvents: {
    USER_SIGNED_UP: 'user_signed_up',
  },
}));

describe('OAuthService', () => {
  it('captures one identified signup when Google creates a new user', async () => {
    const user = {
      id: 'google-user-1',
      email: 'creator@example.com',
      firstName: 'New',
      lastName: 'Creator',
      role: UserRole.ORG_ADMIN,
      organizationId: 'org-1',
      isActive: true,
      passwordHash: null,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const prisma = {
      oAuthAccount: { findUnique: jest.fn().mockResolvedValue(null) },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(user),
      },
      organization: { findUnique: jest.fn().mockResolvedValue(null) },
      refreshToken: { create: jest.fn().mockResolvedValue({}) },
    };
    const jwt = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    };
    const config = {
      get: jest.fn().mockReturnValue(undefined),
      getOrThrow: jest.fn((key: string) => key),
    };
    const notifications = {
      sendAdminNewUserNotification: jest.fn().mockResolvedValue(undefined),
      syncBrevoContact: jest.fn().mockResolvedValue(undefined),
    };
    const posthog = {
      events: { USER_SIGNED_UP: 'user_signed_up' },
      identify: jest.fn(),
      capture: jest.fn(),
      flush: jest.fn().mockResolvedValue(undefined),
    };
    const service = new OAuthService(
      prisma as never,
      jwt as never,
      config as never,
      {} as never,
      {} as never,
      notifications as never,
      posthog as never,
    );

    const result = await service.handleOAuthLogin({
      provider: 'google',
      providerId: 'google-123',
      email: 'Creator@Example.com',
      firstName: 'New',
      lastName: 'Creator',
    });

    expect(result.isNewUser).toBe(true);
    expect(posthog.identify).toHaveBeenCalledWith(user.id, {
      email: user.email,
      role: user.role,
    });
    expect(posthog.capture).toHaveBeenCalledWith(user.id, 'user_signed_up', {
      signup_method: 'google',
      organization_id: user.organizationId,
      email_verified: true,
    });
    expect(posthog.flush).toHaveBeenCalledTimes(1);
    expect(notifications.syncBrevoContact).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  });
});
