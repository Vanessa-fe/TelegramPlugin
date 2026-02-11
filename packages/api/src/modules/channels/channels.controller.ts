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
import {
  createChannelSchema,
  updateChannelSchema,
  startVerificationSchema,
  verifyChannelSchema,
  verifyDiscordChannelSchema,
  setDiscordRoleSchema,
} from './channels.schema';
import type {
  CreateChannelDto,
  UpdateChannelDto,
  StartVerificationDto,
  VerifyChannelDto,
  VerifyDiscordChannelDto,
  SetDiscordRoleDto,
} from './channels.schema';
import { ChannelsService } from './channels.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { resolveOrganizationScope } from '../auth/utils/organization-scope';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  // ========== Verification Endpoints (MUST be before :id routes) ==========

  @Post('verification/start')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  startVerification(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(startVerificationSchema))
    body: StartVerificationDto,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.channelsService.startVerification(organizationId, body);
  }

  @Post('verification/verify')
  @Public()
  verifyFromBot(
    @Body(new ZodValidationPipe(verifyChannelSchema)) body: VerifyChannelDto,
  ) {
    return this.channelsService.verifyFromBot(body);
  }

  @Get('verification/:id/status')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  checkVerificationStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.channelsService.checkVerificationStatus(id, organizationId);
  }

  @Post('verification/:id/confirm')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  confirmVerification(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.channelsService.confirmVerification(id, organizationId);
  }

  // ========== Discord Verification Endpoints ==========

  @Post('verification/discord/verify')
  @Public()
  verifyDiscordFromBot(
    @Body(new ZodValidationPipe(verifyDiscordChannelSchema)) body: VerifyDiscordChannelDto,
  ) {
    return this.channelsService.verifyDiscordFromBot(body);
  }

  @Post('verification/:id/discord/role')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  setDiscordRole(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(setDiscordRoleSchema)) body: SetDiscordRoleDto,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.channelsService.setDiscordRole(id, organizationId, body);
  }

  @Post('verification/:id/discord/confirm')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  confirmDiscordVerification(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const organizationId = resolveOrganizationScope(user);
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.channelsService.confirmDiscordVerification(id, organizationId);
  }

  // ========== Discord Guild Endpoints ==========

  @Get(':id/discord')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN, UserRole.SUPPORT, UserRole.VIEWER)
  async getDiscordGuild(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const channel = await this.channelsService.findOne(id);
    resolveOrganizationScope(user, channel.organizationId);
    return this.channelsService.getDiscordGuild(id);
  }

  @Patch(':id/discord/role')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async updateDiscordRole(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(setDiscordRoleSchema)) body: SetDiscordRoleDto,
  ) {
    const channel = await this.channelsService.findOne(id);
    resolveOrganizationScope(user, channel.organizationId);
    return this.channelsService.updateDiscordRole(id, body);
  }

  // ========== Standard Channel Endpoints ==========

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
    if (!scopedOrgId) {
      throw new Error('Organization ID is required');
    }
    return this.channelsService.findAll(scopedOrgId);
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
    const channel = await this.channelsService.findOne(id);
    resolveOrganizationScope(user, channel.organizationId);
    return channel;
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createChannelSchema)) body: CreateChannelDto,
  ) {
    resolveOrganizationScope(user, body.organizationId);
    return this.channelsService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateChannelSchema)) body: UpdateChannelDto,
  ) {
    const channel = await this.channelsService.findOne(id);
    resolveOrganizationScope(user, channel.organizationId);
    if (body.organizationId) {
      resolveOrganizationScope(user, body.organizationId);
    }
    return this.channelsService.update(id, body);
  }

  @Get(':id/accesses')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ORG_ADMIN,
    UserRole.SUPPORT,
    UserRole.VIEWER,
  )
  async getAccesses(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const channel = await this.channelsService.findOne(id);
    resolveOrganizationScope(user, channel.organizationId);
    return this.channelsService.getAccesses(id);
  }
}
