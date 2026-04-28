import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common';
import {
  createAffiliateProgramSchema,
  updateAffiliateProgramSchema,
} from './affiliate-program.schema';
import type {
  CreateAffiliateProgramDto,
  UpdateAffiliateProgramDto,
} from './affiliate-program.schema';
import { AffiliateProgramService } from './affiliate-program.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePlan } from '../auth/decorators/require-plan.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';

@Controller('affiliate-program')
@RequirePlan('growth', 'pro')
export class AffiliateProgramController {
  constructor(
    private readonly affiliateProgramService: AffiliateProgramService,
  ) {}

  @Get()
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  async findOne(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.affiliateProgramService.findOne(scopedOrgId);
  }

  @Get('stats')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  async getStats(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.affiliateProgramService.getStats(scopedOrgId);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createAffiliateProgramSchema))
    body: CreateAffiliateProgramDto,
  ) {
    resolveOrganizationScope(user, body.organizationId);
    return this.affiliateProgramService.create(body);
  }

  @Patch()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async update(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId: string | undefined,
    @Body(new ZodValidationPipe(updateAffiliateProgramSchema))
    body: UpdateAffiliateProgramDto,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.affiliateProgramService.update(scopedOrgId, body);
  }
}
