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
import { createCustomerSchema, updateCustomerSchema } from './customers.schema';
import type { CreateCustomerDto, UpdateCustomerDto } from './customers.schema';
import { CustomersService } from './customers.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    return this.customersService.findAll(scopedOrgId);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const customer = await this.customersService.findOne(id);
    resolveOrganizationScope(user, customer.organizationId);
    return customer;
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createCustomerSchema))
    body: CreateCustomerDto,
  ) {
    resolveOrganizationScope(user, body.organizationId);
    return this.customersService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateCustomerSchema))
    body: UpdateCustomerDto,
  ) {
    const customer = await this.customersService.findOne(id);
    resolveOrganizationScope(user, customer.organizationId);
    if (body.organizationId) {
      resolveOrganizationScope(user, body.organizationId);
    }
    return this.customersService.update(id, body);
  }
}
