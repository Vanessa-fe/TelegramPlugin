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
import { createCheckoutSchema, type CreateCheckoutDto } from './billing.schema';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('stripe/status')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT)
  getStripeStatus(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.billingService.getStripeStatus(scopedOrgId);
  }

  @Post('stripe/connect')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT)
  createStripeConnectLink(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.billingService.createStripeConnectLink(scopedOrgId);
  }

  @Post('stripe/login')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT)
  createStripeLoginLink(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.billingService.createStripeLoginLink(scopedOrgId);
  }

  @Public()
  @Post('checkout')
  createCheckoutSession(
    @Body(new ZodValidationPipe(createCheckoutSchema))
    body: CreateCheckoutDto,
  ) {
    return this.billingService.createCheckoutSession(body);
  }
}
