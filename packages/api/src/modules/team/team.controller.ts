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
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';
import {
  acceptTeamInviteSchema,
  createTeamInviteSchema,
  updateTeamMemberRoleSchema,
} from './team.schema';
import type {
  AcceptTeamInviteDto,
  CreateTeamInviteDto,
  UpdateTeamMemberRoleDto,
} from './team.schema';
import { TeamService } from './team.service';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('members')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  listMembers(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.teamService.listMembers(scopedOrgId);
  }

  @Patch('members/:id/role')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  updateMemberRole(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateTeamMemberRoleSchema))
    body: UpdateTeamMemberRoleDto,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }

    return this.teamService.updateMemberRole(scopedOrgId, id, user.userId, body);
  }

  @Patch('members/:id/deactivate')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  deactivateMember(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }

    return this.teamService.deactivateMember(scopedOrgId, id, user.userId);
  }

  @Patch('members/:id/reactivate')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  reactivateMember(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }

    return this.teamService.reactivateMember(scopedOrgId, id);
  }

  @Delete('members/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }

    return this.teamService.removeMember(scopedOrgId, id, user.userId);
  }

  @Get('invites')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  listInvites(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.teamService.listPendingInvites(scopedOrgId);
  }

  @Post('invites')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  createInvite(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTeamInviteSchema)) body: CreateTeamInviteDto,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, body.organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.teamService.createInvite(scopedOrgId, user.userId, body);
  }

  @Delete('invites/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  revokeInvite(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const scopedOrgId = resolveOrganizationScope(user, organizationId);
    if (!scopedOrgId) {
      throw new BadRequestException('Organization ID is required');
    }

    return this.teamService.revokeInvite(scopedOrgId, id);
  }

  @Get('invites/public/:token')
  @Public()
  getPublicInvite(@Param('token') token: string) {
    return this.teamService.getPublicInvite(token);
  }

  @Post('invites/accept')
  @Public()
  acceptInvite(
    @Body(new ZodValidationPipe(acceptTeamInviteSchema)) body: AcceptTeamInviteDto,
  ) {
    return this.teamService.acceptInvite(body);
  }
}
