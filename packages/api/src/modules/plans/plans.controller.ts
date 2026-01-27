import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common';
import { createPlanSchema, updatePlanSchema } from './plans.schema';
import type { CreatePlanDto, UpdatePlanDto } from './plans.schema';
import { PlansService } from './plans.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('productId') productId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    return this.plansService.findAll({
      productId,
      organizationId: scopedOrgId,
      includeInactive: includeInactive === 'true',
    });
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
    const plan = await this.plansService.findOne(id);
    resolveOrganizationScope(user, plan.product.organizationId);
    return plan;
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPlanSchema))
    body: CreatePlanDto,
  ) {
    const organizationId = await this.plansService.getProductOrganization(
      body.productId,
    );
    if (!organizationId) {
      throw new NotFoundException('Produit introuvable pour ce plan');
    }
    resolveOrganizationScope(user, organizationId);
    return this.plansService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updatePlanSchema))
    body: UpdatePlanDto,
  ) {
    const plan = await this.plansService.findOne(id);
    resolveOrganizationScope(user, plan.product.organizationId);
    if (body.productId) {
      const organizationId = await this.plansService.getProductOrganization(
        body.productId,
      );
      if (!organizationId) {
        throw new NotFoundException('Produit cible introuvable');
      }
      resolveOrganizationScope(user, organizationId);
    }
    return this.plansService.update(id, body);
  }
}
