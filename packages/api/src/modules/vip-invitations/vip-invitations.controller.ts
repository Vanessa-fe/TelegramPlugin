import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole, VipInvitationStatus } from '@prisma/client';
import { ZodValidationPipe } from '../../common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { VipInvitationsService } from './vip-invitations.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  createVipInvitationSchema,
  extendVipTrialSchema,
  type CreateVipInvitationDto,
  type ExtendVipTrialDto,
} from './vip-invitations.schema';

@Controller('admin/vip-invitations')
export class VipInvitationsController {
  private readonly frontendUrl: string;

  constructor(
    private readonly vipInvitationsService: VipInvitationsService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('CORS_ORIGIN') ||
      'https://telegramplugin.netlify.app';
  }

  @Post()
  @Roles(UserRole.SUPERADMIN)
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createVipInvitationSchema))
    dto: CreateVipInvitationDto,
  ) {
    const invitation = await this.vipInvitationsService.create(
      dto,
      user.userId,
    );

    // Build activation link with token
    const activationLink = `${this.frontendUrl}/register?vip=${invitation.token}`;

    // Send VIP invitation email via Brevo
    await this.notificationsService.sendVipInvitationEmail({
      to: invitation.email,
      activationLink,
      planName: invitation.platformPlanName,
      trialDays: invitation.trialDays,
      notes: dto.notes,
    });

    // Mark email as sent
    await this.vipInvitationsService.markEmailSent(invitation.id);

    return invitation;
  }

  @Get()
  @Roles(UserRole.SUPERADMIN)
  async findAll(
    @Query('status') status?: VipInvitationStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.vipInvitationsService.findAll({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('stats')
  @Roles(UserRole.SUPERADMIN)
  async getStats() {
    return this.vipInvitationsService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN)
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.vipInvitationsService.findOne(id);
  }

  @Post(':id/extend')
  @Roles(UserRole.SUPERADMIN)
  async extendTrial(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(extendVipTrialSchema)) dto: ExtendVipTrialDto,
  ) {
    return this.vipInvitationsService.extendTrial(id, dto.additionalDays);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  async cancel(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.vipInvitationsService.cancel(id);
  }
}
