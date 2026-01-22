import { Body, Controller, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ChannelAccessService } from './channel-access.service';

@Controller('access')
export class ChannelAccessController {
  constructor(private readonly channelAccessService: ChannelAccessService) {}

  @Post('grant')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async grantAccess(
    @Body()
    body: {
      subscriptionId: string;
      channelId: string;
      customerId: string;
    },
  ) {
    // For manual grant, we use 'STRIPE' as a default provider
    // This will trigger the grant-access queue job
    await this.channelAccessService.handlePaymentSuccess(
      body.subscriptionId,
      'STRIPE',
    );

    return {
      message: 'Access grant initiated successfully',
    };
  }

  @Post('revoke')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async revokeAccess(
    @Body()
    body: {
      subscriptionId: string;
      reason: 'payment_failed' | 'canceled' | 'manual' | 'refund';
    },
  ) {
    const reason = body.reason === 'manual' ? 'canceled' : body.reason;

    await this.channelAccessService.handlePaymentFailure(
      body.subscriptionId,
      reason,
    );

    return {
      message: 'Access revoke initiated successfully',
    };
  }
}
