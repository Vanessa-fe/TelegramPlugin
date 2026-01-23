import 'reflect-metadata';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './decorators/roles.decorator';
import { BillingController } from '../billing/billing.controller';
import { SubscriptionsController } from '../subscriptions/subscriptions.controller';
import { ChannelAccessController } from '../channel-access/channel-access.controller';
import { PaymentEventsController } from '../payment-events/payment-events.controller';

describe('RBAC metadata', () => {
  const getRoles = (target: Record<string, unknown>, propertyKey: string): UserRole[] =>
    Reflect.getMetadata(ROLES_KEY, target[propertyKey]) ?? [];

  describe('support read-only + manual actions', () => {
    it('should allow support on read endpoints', () => {
      const roles = getRoles(
        SubscriptionsController.prototype,
        'findAll',
      );
      expect(roles).toContain(UserRole.SUPPORT);
    });

    it('should restrict support from billing connect/login', () => {
      const connectRoles = getRoles(
        BillingController.prototype,
        'createStripeConnectLink',
      );
      const loginRoles = getRoles(
        BillingController.prototype,
        'createStripeLoginLink',
      );

      expect(connectRoles).not.toContain(UserRole.SUPPORT);
      expect(loginRoles).not.toContain(UserRole.SUPPORT);
    });

    it('should restrict support from subscription writes', () => {
      const createRoles = getRoles(
        SubscriptionsController.prototype,
        'create',
      );
      const updateRoles = getRoles(
        SubscriptionsController.prototype,
        'update',
      );

      expect(createRoles).not.toContain(UserRole.SUPPORT);
      expect(updateRoles).not.toContain(UserRole.SUPPORT);
    });

    it('should keep support-only manual access endpoints', () => {
      const grantRoles = getRoles(
        ChannelAccessController.prototype,
        'supportGrantAccess',
      );
      const revokeRoles = getRoles(
        ChannelAccessController.prototype,
        'supportRevokeAccess',
      );
      const replayRoles = getRoles(
        ChannelAccessController.prototype,
        'supportReplayDeadLetter',
      );

      expect(grantRoles).toEqual([UserRole.SUPPORT]);
      expect(revokeRoles).toEqual([UserRole.SUPPORT]);
      expect(replayRoles).toEqual([UserRole.SUPPORT]);
    });
  });

  describe('admin payment secrets', () => {
    it('should restrict org admin from payment events', () => {
      const listRoles = getRoles(
        PaymentEventsController.prototype,
        'findAll',
      );
      const detailRoles = getRoles(
        PaymentEventsController.prototype,
        'findOne',
      );

      expect(listRoles).not.toContain(UserRole.ORG_ADMIN);
      expect(detailRoles).not.toContain(UserRole.ORG_ADMIN);
    });
  });
});
