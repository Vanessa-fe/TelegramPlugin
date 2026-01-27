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
import { createProductSchema, updateProductSchema } from './products.schema';
import type { CreateProductDto, UpdateProductDto } from './products.schema';
import { ProductsService } from './products.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
    return this.productsService.findAll(scopedOrgId);
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
    const product = await this.productsService.findOne(id);
    resolveOrganizationScope(user, product.organizationId);
    return product;
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createProductSchema)) body: CreateProductDto,
  ) {
    resolveOrganizationScope(user, body.organizationId);
    return this.productsService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) body: UpdateProductDto,
  ) {
    const product = await this.productsService.findOne(id);
    resolveOrganizationScope(user, product.organizationId);
    if (body.organizationId) {
      resolveOrganizationScope(user, body.organizationId);
    }
    return this.productsService.update(id, body);
  }
}
