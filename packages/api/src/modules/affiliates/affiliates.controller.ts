import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { UserRole } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { ZodValidationPipe } from '../../common';
import {
  createAffiliateSchema,
  createPayoutSchema,
  trackClickSchema,
  updateAffiliateSchema,
  updatePayoutSchema,
  validateAffiliateSchema,
} from './affiliates.schema';
import type {
  CreateAffiliateDto,
  CreatePayoutDto,
  TrackClickDto,
  UpdateAffiliateDto,
  UpdatePayoutDto,
  ValidateAffiliateDto,
} from './affiliates.schema';
import { AffiliatesService } from './affiliates.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePlan } from '../auth/decorators/require-plan.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';

@Controller('affiliates')
@RequirePlan('growth', 'pro')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Get()
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.affiliatesService.findAll(scopedOrgId);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const affiliate = await this.affiliatesService.findOne(id);
    resolveOrganizationScope(user, affiliate.organizationId);
    return affiliate;
  }

  @Get(':id/referrals')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  async getReferrals(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const affiliate = await this.affiliatesService.findOne(id);
    resolveOrganizationScope(user, affiliate.organizationId);
    return this.affiliatesService.getReferrals(id);
  }

  @Get(':id/payouts')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  async getPayouts(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const affiliate = await this.affiliatesService.findOne(id);
    resolveOrganizationScope(user, affiliate.organizationId);
    return this.affiliatesService.getPayouts(id);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createAffiliateSchema))
    body: CreateAffiliateDto,
  ) {
    resolveOrganizationScope(user, body.organizationId);
    return this.affiliatesService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateAffiliateSchema))
    body: UpdateAffiliateDto,
  ) {
    const affiliate = await this.affiliatesService.findOne(id);
    resolveOrganizationScope(user, affiliate.organizationId);
    return this.affiliatesService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async deactivate(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const affiliate = await this.affiliatesService.findOne(id);
    resolveOrganizationScope(user, affiliate.organizationId);
    return this.affiliatesService.deactivate(id);
  }

  @Post(':id/payouts')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async createPayout(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(createPayoutSchema)) body: CreatePayoutDto,
  ) {
    const affiliate = await this.affiliatesService.findOne(id);
    resolveOrganizationScope(user, affiliate.organizationId);
    return this.affiliatesService.createPayout(id, body);
  }

  @Patch('payouts/:payoutId')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async updatePayout(
    @CurrentUser() user: AuthUser,
    @Param('payoutId', new ParseUUIDPipe()) payoutId: string,
    @Body(new ZodValidationPipe(updatePayoutSchema)) body: UpdatePayoutDto,
  ) {
    const payout = await this.affiliatesService.updatePayout(payoutId, body);
    const affiliate = await this.affiliatesService.findOne(payout.affiliateId);
    resolveOrganizationScope(user, affiliate.organizationId);
    return payout;
  }

  @Post('validate')
  @Public()
  async validate(
    @Body(new ZodValidationPipe(validateAffiliateSchema))
    body: ValidateAffiliateDto,
  ) {
    return this.affiliatesService.validate(body);
  }

  @Post('track-click')
  @Public()
  async trackClick(
    @Body(new ZodValidationPipe(trackClickSchema))
    body: TrackClickDto,
    @Req() request: FastifyRequest,
  ) {
    const ipAddress =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      request.ip;
    return this.affiliatesService.trackClick(body, ipAddress);
  }

  @Get('stats')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  async getOrganizationStats(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.affiliatesService.getOrganizationStats(scopedOrgId);
  }

  @Get(':id/stats')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  async getAffiliateStats(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const affiliate = await this.affiliatesService.findOne(id);
    resolveOrganizationScope(user, affiliate.organizationId);
    return this.affiliatesService.getAffiliateStats(id);
  }

  @Get(':id/clicks')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  async getClicks(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('limit') limit?: string,
  ) {
    const affiliate = await this.affiliatesService.findOne(id);
    resolveOrganizationScope(user, affiliate.organizationId);
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.affiliatesService.getRecentClicks(id, limitNum);
  }

  @Post('referrals/:referralId/approve')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async approveReferral(
    @CurrentUser() user: AuthUser,
    @Param('referralId', new ParseUUIDPipe()) referralId: string,
  ) {
    const referral = await this.affiliatesService.approveReferral(referralId);
    const affiliate = await this.affiliatesService.findOne(
      referral.affiliateId,
    );
    resolveOrganizationScope(user, affiliate.organizationId);
    return referral;
  }

  @Post('referrals/:referralId/cancel')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async cancelReferral(
    @CurrentUser() user: AuthUser,
    @Param('referralId', new ParseUUIDPipe()) referralId: string,
  ) {
    const referral = await this.affiliatesService.cancelReferral(referralId);
    const affiliate = await this.affiliatesService.findOne(
      referral.affiliateId,
    );
    resolveOrganizationScope(user, affiliate.organizationId);
    return referral;
  }
}
