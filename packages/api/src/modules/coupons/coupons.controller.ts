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
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common';
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from './coupons.schema';
import type {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './coupons.schema';
import { CouponsService } from './coupons.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly couponsService: CouponsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.couponsService.findAll(scopedOrgId);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const coupon = await this.couponsService.findOne(id);
    resolveOrganizationScope(user, coupon.organizationId);
    return coupon;
  }

  @Get(':id/usages')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  async getUsages(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const coupon = await this.couponsService.findOne(id);
    resolveOrganizationScope(user, coupon.organizationId);
    return this.couponsService.getUsages(id);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createCouponSchema as never)) body: CreateCouponDto,
  ) {
    resolveOrganizationScope(user, body.organizationId);
    return this.couponsService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateCouponSchema)) body: UpdateCouponDto,
  ) {
    const coupon = await this.couponsService.findOne(id);
    resolveOrganizationScope(user, coupon.organizationId);
    return this.couponsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async disable(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const coupon = await this.couponsService.findOne(id);
    resolveOrganizationScope(user, coupon.organizationId);
    return this.couponsService.disable(id);
  }

  @Post('validate')
  @Public()
  async validate(
    @Body(new ZodValidationPipe(validateCouponSchema)) body: ValidateCouponDto,
  ) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: body.planId },
      include: {
        product: {
          select: { organizationId: true },
        },
      },
    });

    if (!plan) {
      return { valid: false, error: 'Plan introuvable' };
    }

    if (plan.product.organizationId !== body.organizationId) {
      return { valid: false, error: 'Plan introuvable' };
    }

    return this.couponsService.validate(body, plan.priceCents);
  }
}
