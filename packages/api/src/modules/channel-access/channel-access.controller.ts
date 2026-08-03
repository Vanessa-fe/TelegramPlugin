import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { ChannelAccessService } from './channel-access.service';
import { ChannelAccessQueue } from './channel-access.queue';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('access')
export class ChannelAccessController {
  constructor(
    private readonly channelAccessService: ChannelAccessService,
    private readonly channelAccessQueue: ChannelAccessQueue,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('grant')
  @Roles(UserRole.SUPERADMIN)
  async grantAccess(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      subscriptionId: string;
      channelId: string;
      customerId: string;
    },
  ) {
    await this.channelAccessService.grantVerifiedAccess(
      body.subscriptionId,
      user.role === UserRole.SUPERADMIN ? undefined : user.organizationId,
    );

    return {
      message: 'Access grant initiated successfully',
    };
  }

  @Post('revoke')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async revokeAccess(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      subscriptionId: string;
      reason: 'payment_failed' | 'canceled' | 'manual' | 'refund';
    },
  ) {
    await this.channelAccessService.assertSubscriptionOwnership(
      body.subscriptionId,
      user.role === UserRole.SUPERADMIN ? undefined : user.organizationId,
    );
    const reason = body.reason === 'manual' ? 'canceled' : body.reason;

    await this.channelAccessService.handlePaymentFailure(
      body.subscriptionId,
      reason,
    );

    return {
      message: 'Access revoke initiated successfully',
    };
  }

  @Post('replay')
  @Roles(UserRole.SUPERADMIN)
  async replayDeadLetter(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      queue: 'grant' | 'revoke';
      jobId: string;
    },
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    if (body.queue === 'grant') {
      await this.channelAccessQueue.replayGrantAccess(body.jobId);
    } else if (body.queue === 'revoke') {
      await this.channelAccessQueue.replayRevokeAccess(body.jobId);
    } else {
      throw new BadRequestException('Invalid queue selection');
    }

    const subscriptionId = this.parseSubscriptionId(body.jobId);
    if (subscriptionId) {
      const resolvedCorrelationId = this.resolveCorrelationId(
        correlationId,
        requestId,
      );
      const metadata = this.buildAuditMetadata(user.role, requestId, {
        queue: body.queue,
        jobId: body.jobId,
        subscriptionId,
      });

      await this.auditLogService.createForSubscription({
        subscriptionId,
        actorId: user.userId,
        action: 'admin.access.replay',
        resourceType: 'access_job',
        resourceId: body.jobId,
        correlationId: resolvedCorrelationId,
        metadata,
      });
    }

    return {
      message: 'Replay initiated successfully',
    };
  }

  @Post('support/grant')
  @Roles(UserRole.SUPPORT)
  async supportGrantAccess(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      subscriptionId: string;
    },
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    await this.channelAccessService.grantVerifiedAccess(
      body.subscriptionId,
      user.role === UserRole.SUPPORT ? undefined : user.organizationId,
    );

    const resolvedCorrelationId = this.resolveCorrelationId(
      correlationId,
      requestId,
    );
    const metadata = this.buildAuditMetadata(user.role, requestId);

    await this.auditLogService.createForSubscription({
      subscriptionId: body.subscriptionId,
      actorId: user.userId,
      action: 'support.access.grant',
      resourceType: 'subscription',
      resourceId: body.subscriptionId,
      correlationId: resolvedCorrelationId,
      metadata,
    });

    return {
      message: 'Support access grant initiated successfully',
    };
  }

  @Post('support/revoke')
  @Roles(UserRole.SUPPORT)
  async supportRevokeAccess(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      subscriptionId: string;
      reason: 'payment_failed' | 'canceled' | 'manual' | 'refund';
    },
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    const reason = body.reason === 'manual' ? 'canceled' : body.reason;

    await this.channelAccessService.handlePaymentFailure(
      body.subscriptionId,
      reason,
    );

    const resolvedCorrelationId = this.resolveCorrelationId(
      correlationId,
      requestId,
    );
    const metadata = this.buildAuditMetadata(user.role, requestId, {
      reason: body.reason,
    });

    await this.auditLogService.createForSubscription({
      subscriptionId: body.subscriptionId,
      actorId: user.userId,
      action: 'support.access.revoke',
      resourceType: 'subscription',
      resourceId: body.subscriptionId,
      correlationId: resolvedCorrelationId,
      metadata,
    });

    return {
      message: 'Support access revoke initiated successfully',
    };
  }

  @Post('support/replay')
  @Roles(UserRole.SUPPORT)
  async supportReplayDeadLetter(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      queue: 'grant' | 'revoke';
      jobId: string;
    },
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    if (body.queue === 'grant') {
      await this.channelAccessQueue.replayGrantAccess(body.jobId);
    } else if (body.queue === 'revoke') {
      await this.channelAccessQueue.replayRevokeAccess(body.jobId);
    } else {
      throw new BadRequestException('Invalid queue selection');
    }

    const subscriptionId = this.parseSubscriptionId(body.jobId);
    if (subscriptionId) {
      const resolvedCorrelationId = this.resolveCorrelationId(
        correlationId,
        requestId,
      );
      const metadata = this.buildAuditMetadata(user.role, requestId, {
        queue: body.queue,
        jobId: body.jobId,
        subscriptionId,
      });

      await this.auditLogService.createForSubscription({
        subscriptionId,
        actorId: user.userId,
        action: 'support.access.replay',
        resourceType: 'access_job',
        resourceId: body.jobId,
        correlationId: resolvedCorrelationId,
        metadata,
      });
    }

    return {
      message: 'Support replay initiated successfully',
    };
  }

  @Post('manual/grant')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async confirmManualGrant(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      accessId: string;
    },
  ) {
    const updated = await this.channelAccessService.confirmManualGrant(
      body.accessId,
      user.role === UserRole.SUPERADMIN ? undefined : user.organizationId,
    );

    await this.auditLogService.create({
      organizationId: updated.channel.organizationId,
      actorId: user.userId,
      action: 'access.manual_grant',
      resourceType: 'channel_access',
      resourceId: updated.id,
    });

    return updated;
  }

  @Post('manual/revoke')
  @Roles(UserRole.SUPERADMIN, UserRole.ORG_ADMIN)
  async confirmManualRevoke(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      accessId: string;
    },
  ) {
    const updated = await this.channelAccessService.confirmManualRevoke(
      body.accessId,
      user.role === UserRole.SUPERADMIN ? undefined : user.organizationId,
    );

    await this.auditLogService.create({
      organizationId: updated.channel.organizationId,
      actorId: user.userId,
      action: 'access.manual_revoke',
      resourceType: 'channel_access',
      resourceId: updated.id,
      metadata: {
        reason: updated.revokeReason,
      },
    });

    return updated;
  }

  private parseSubscriptionId(jobId: string): string | null {
    const segments = jobId.split(':');
    if (segments.length < 2) {
      return null;
    }

    return segments[1] || null;
  }

  private resolveCorrelationId(
    correlationId?: string,
    requestId?: string,
  ): string | null {
    return correlationId ?? requestId ?? null;
  }

  private buildAuditMetadata(
    actorRole: UserRole,
    requestId?: string,
    extra?: Record<string, unknown>,
  ): Prisma.JsonValue {
    const metadata: Record<string, unknown> = {
      actorRole,
    };

    if (requestId) {
      metadata.requestId = requestId;
    }

    if (extra) {
      Object.assign(metadata, extra);
    }

    return metadata as Prisma.JsonValue;
  }
}
