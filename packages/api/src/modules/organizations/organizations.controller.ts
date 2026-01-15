import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from './organizations.schema';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './organizations.schema';
import { OrganizationsService } from './organizations.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Roles(UserRole.SUPERADMIN)
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, id) ?? id;
    return this.organizationsService.findOne(scopedOrgId);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN)
  create(
    @Body(new ZodValidationPipe(createOrganizationSchema))
    body: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateOrganizationSchema))
    body: UpdateOrganizationDto,
  ) {
    if (user.role !== UserRole.SUPERADMIN && body.saasActive !== undefined) {
      throw new ForbiddenException(
        "Seul un super-admin peut modifier l'abonnement SaaS",
      );
    }
    const scopedOrgId = resolveOrganizationScope(user, id) ?? id;
    return this.organizationsService.update(scopedOrgId, body);
  }
}
