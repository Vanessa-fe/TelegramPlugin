import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';
import { DataExportsService } from './data-exports.service';
import {
  createDataExportSchema,
  type CreateDataExportDto,
} from './data-exports.schema';

@Controller('data-exports')
export class DataExportsController {
  constructor(private readonly dataExportsService: DataExportsService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async requestExport(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createDataExportSchema))
    body: CreateDataExportDto,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, body.organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('organizationId is required');
    }

    return this.dataExportsService.requestExport(scopedOrgId, user.userId);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    return this.dataExportsService.findAll(scopedOrgId);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const exportJob = await this.dataExportsService.findOne(id);
    resolveOrganizationScope(user, exportJob.organizationId);
    return exportJob;
  }
}
