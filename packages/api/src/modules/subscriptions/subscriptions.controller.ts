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
import { createSubscriptionSchema, updateSubscriptionSchema } from './subscriptions.schema';
import type {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './subscriptions.schema';
import { SubscriptionsService } from './subscriptions.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    return this.subscriptionsService.findAll(scopedOrgId);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const subscription = await this.subscriptionsService.findOne(id);
    resolveOrganizationScope(user, subscription.organizationId);
    return subscription;
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createSubscriptionSchema))
    body: CreateSubscriptionDto,
  ) {
    resolveOrganizationScope(user, body.organizationId);
    return this.subscriptionsService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateSubscriptionSchema))
    body: UpdateSubscriptionDto,
  ) {
    const subscription = await this.subscriptionsService.findOne(id);
    resolveOrganizationScope(user, subscription.organizationId);
    if (body.organizationId) {
      resolveOrganizationScope(user, body.organizationId);
    }
    return this.subscriptionsService.update(id, body);
  }
}
