import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common';
import { createPaymentEventSchema } from './payment-events.schema';
import type { CreatePaymentEventDto } from './payment-events.schema';
import { PaymentEventsService } from './payment-events.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';

@Controller('payment-events')
export class PaymentEventsController {
  constructor(private readonly paymentEventsService: PaymentEventsService) {}

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.SUPPORT, UserRole.ORG_ADMIN)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    return this.paymentEventsService.findAll(scopedOrgId);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.SUPPORT, UserRole.ORG_ADMIN)
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const event = await this.paymentEventsService.findOne(id);
    resolveOrganizationScope(user, event.organizationId);
    return event;
  }

  @Post()
  @Roles(UserRole.SUPERADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPaymentEventSchema))
    body: CreatePaymentEventDto,
  ) {
    resolveOrganizationScope(user, body.organizationId);
    return this.paymentEventsService.create(body);
  }
}
