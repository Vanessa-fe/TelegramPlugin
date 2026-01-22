import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common';
import { createEntitlementSchema, updateEntitlementSchema } from './entitlements.schema';
import type { CreateEntitlementDto, UpdateEntitlementDto } from './entitlements.schema';
import { EntitlementsService } from './entitlements.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';

@Controller('entitlements')
export class EntitlementsController {
  constructor(private readonly entitlementsService: EntitlementsService) {}

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('subscriptionId') subscriptionId?: string,
    @Query('customerId') customerId?: string,
    @Query('entitlementKey') entitlementKey?: string,
  ) {
    return this.entitlementsService.findAll({
      subscriptionId,
      customerId,
      entitlementKey,
    });
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.entitlementsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createEntitlementSchema)) body: CreateEntitlementDto,
  ) {
    return this.entitlementsService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateEntitlementSchema)) body: UpdateEntitlementDto,
  ) {
    return this.entitlementsService.update(id, body);
  }

  @Post(':id/revoke')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  revoke(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('reason') reason: string,
  ) {
    return this.entitlementsService.revoke(id, reason);
  }

  @Get('check/:customerId/:entitlementKey')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  checkEntitlement(
    @CurrentUser() user: AuthUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Param('entitlementKey') entitlementKey: string,
  ) {
    return this.entitlementsService.checkEntitlement(customerId, entitlementKey);
  }

  @Get('customer/:customerId/active')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  getActiveEntitlements(
    @CurrentUser() user: AuthUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
  ) {
    return this.entitlementsService.getActiveEntitlements(customerId);
  }
}
