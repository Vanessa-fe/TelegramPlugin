import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';
import {
  createPlatformCheckoutSchema,
  type CreatePlatformCheckoutDto,
} from './platform-subscription.schema';
import { PlatformSubscriptionService } from './platform-subscription.service';

@Controller('platform')
export class PlatformSubscriptionController {
  constructor(
    private readonly platformSubscriptionService: PlatformSubscriptionService,
  ) {}

  /**
   * GET /platform/plans
   * List available platform plans (public)
   */
  @Public()
  @Get('plans')
  getPlans() {
    return this.platformSubscriptionService.getPlans();
  }

  /**
   * GET /platform/subscription
   * Get current platform subscription status
   */
  @Get('subscription')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT)
  getSubscription(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.platformSubscriptionService.getSubscription(scopedOrgId);
  }

  /**
   * POST /platform/checkout
   * Create a Stripe checkout session for platform subscription
   */
  @Post('checkout')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  createCheckout(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPlatformCheckoutSchema))
    body: CreatePlatformCheckoutDto,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.platformSubscriptionService.createCheckoutSession(
      scopedOrgId,
      body.planName,
    );
  }

  /**
   * POST /platform/portal
   * Create a Stripe Customer Portal link for managing subscription
   */
  @Post('portal')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  createPortal(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.platformSubscriptionService.createPortalSession(scopedOrgId);
  }

  /**
   * POST /platform/cancel
   * Cancel subscription at end of period
   */
  @Post('cancel')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async cancelSubscription(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('organizationId is required');
    }
    await this.platformSubscriptionService.cancelSubscription(scopedOrgId);
    return {
      success: true,
      message: "L'abonnement sera annulé à la fin de la période",
    };
  }
}
