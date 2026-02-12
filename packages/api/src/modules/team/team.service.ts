import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  AcceptTeamInviteDto,
  CreateTeamInviteDto,
  UpdateTeamMemberRoleDto,
} from './team.schema';

export type TeamMemberDto = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

export type TeamInviteDto = {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export type TeamPublicInviteDto =
  | {
      valid: false;
      reason: 'invalid' | 'expired' | 'accepted' | 'revoked';
      message: string;
    }
  | {
      valid: true;
      organizationName: string;
      email: string;
      role: UserRole;
      expiresAt: Date;
    };

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async listMembers(organizationId: string): Promise<TeamMemberDto[]> {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async listPendingInvites(organizationId: string): Promise<TeamInviteDto[]> {
    return this.prisma.teamInvite.findMany({
      where: {
        organizationId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        invitedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInvite(
    organizationId: string,
    invitedByUserId: string,
    dto: CreateTeamInviteDto,
  ) {
    const email = dto.email.trim().toLowerCase();

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      throw new BadRequestException('Organisation introuvable');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (
      existingUser &&
      existingUser.organizationId === organizationId &&
      existingUser.isActive
    ) {
      throw new BadRequestException('Cet utilisateur est déjà membre actif');
    }

    if (
      existingUser?.organizationId &&
      existingUser.organizationId !== organizationId
    ) {
      throw new BadRequestException(
        'Cet email est déjà rattaché à une autre organisation',
      );
    }

    const existingInvite = await this.prisma.teamInvite.findFirst({
      where: {
        organizationId,
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (existingInvite) {
      throw new BadRequestException(
        'Une invitation active existe déjà pour cet email',
      );
    }

    const token = randomBytes(24).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.teamInvite.create({
      data: {
        organizationId,
        email,
        role: dto.role,
        tokenHash,
        invitedByUserId,
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    const inviteUrl = `${this.getFrontendBaseUrl()}/invite/${token}`;

    await this.notifications.sendTeamInviteEmail(
      email,
      organization.name,
      inviteUrl,
      dto.role,
    );

    return {
      ...invite,
      inviteUrl,
    };
  }

  async revokeInvite(organizationId: string, inviteId: string) {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { id: inviteId },
      select: {
        id: true,
        organizationId: true,
        acceptedAt: true,
        revokedAt: true,
      },
    });

    if (!invite || invite.organizationId !== organizationId) {
      throw new NotFoundException('Invitation introuvable');
    }

    if (invite.acceptedAt) {
      throw new BadRequestException('Cette invitation a déjà été acceptée');
    }

    if (invite.revokedAt) {
      return { success: true };
    }

    await this.prisma.teamInvite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  async updateMemberRole(
    organizationId: string,
    memberId: string,
    actorUserId: string,
    dto: UpdateTeamMemberRoleDto,
  ): Promise<TeamMemberDto> {
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        organizationId: true,
      },
    });

    if (!member || member.organizationId !== organizationId) {
      throw new NotFoundException('Membre introuvable');
    }

    if (member.role === UserRole.SUPERADMIN) {
      throw new BadRequestException('Le rôle SUPERADMIN ne peut pas être modifié ici');
    }

    if (member.role === dto.role) {
      return member;
    }

    if (member.role === UserRole.ORG_ADMIN && dto.role !== UserRole.ORG_ADMIN) {
      await this.ensureAtLeastOneActiveAdmin(organizationId, member.id);
    }

    const updated = await this.prisma.user.update({
      where: { id: memberId },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (member.id === actorUserId && member.role === UserRole.ORG_ADMIN) {
      await this.ensureAtLeastOneActiveAdmin(organizationId);
    }

    return updated;
  }

  async deactivateMember(
    organizationId: string,
    memberId: string,
    actorUserId: string,
  ): Promise<TeamMemberDto> {
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        organizationId: true,
      },
    });

    if (!member || member.organizationId !== organizationId) {
      throw new NotFoundException('Membre introuvable');
    }

    if (member.id === actorUserId) {
      throw new BadRequestException(
        'Vous ne pouvez pas désactiver votre propre compte',
      );
    }

    if (member.role === UserRole.SUPERADMIN) {
      throw new BadRequestException('Le compte SUPERADMIN ne peut pas être désactivé ici');
    }

    if (member.role === UserRole.ORG_ADMIN && member.isActive) {
      await this.ensureAtLeastOneActiveAdmin(organizationId, member.id);
    }

    const updated = await this.prisma.user.update({
      where: { id: memberId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return updated;
  }

  async reactivateMember(
    organizationId: string,
    memberId: string,
  ): Promise<TeamMemberDto> {
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        organizationId: true,
      },
    });

    if (!member || member.organizationId !== organizationId) {
      throw new NotFoundException('Membre introuvable');
    }

    if (member.isActive) {
      return member;
    }

    if (member.role === UserRole.SUPERADMIN) {
      throw new BadRequestException(
        'Le compte SUPERADMIN ne peut pas être réactivé ici',
      );
    }

    return this.prisma.user.update({
      where: { id: memberId },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });
  }

  async removeMember(
    organizationId: string,
    memberId: string,
    actorUserId: string,
  ): Promise<{ success: true }> {
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        organizationId: true,
      },
    });

    if (!member || member.organizationId !== organizationId) {
      throw new NotFoundException('Membre introuvable');
    }

    if (member.id === actorUserId) {
      throw new BadRequestException(
        'Vous ne pouvez pas supprimer votre propre compte de l’organisation',
      );
    }

    if (member.role === UserRole.SUPERADMIN) {
      throw new BadRequestException(
        'Le compte SUPERADMIN ne peut pas être supprimé ici',
      );
    }

    if (member.role === UserRole.ORG_ADMIN && member.isActive) {
      await this.ensureAtLeastOneActiveAdmin(organizationId, member.id);
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: member.id },
        data: {
          organizationId: null,
          role: UserRole.VIEWER,
          isActive: false,
        },
      });

      await tx.teamInvite.updateMany({
        where: {
          organizationId,
          email: member.email,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          revokedAt: now,
        },
      });
    });

    return { success: true };
  }

  async getPublicInvite(token: string): Promise<TeamPublicInviteDto> {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { tokenHash: this.hashToken(token) },
      select: {
        email: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return {
        valid: false,
        reason: 'invalid',
        message: 'Invitation invalide',
      };
    }

    if (invite.revokedAt) {
      return {
        valid: false,
        reason: 'revoked',
        message: 'Cette invitation a été révoquée',
      };
    }

    if (invite.acceptedAt) {
      return {
        valid: false,
        reason: 'accepted',
        message: 'Cette invitation a déjà été acceptée',
      };
    }

    if (invite.expiresAt <= new Date()) {
      return {
        valid: false,
        reason: 'expired',
        message: 'Cette invitation a expiré',
      };
    }

    return {
      valid: true,
      organizationName: invite.organization.name,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    };
  }

  async acceptInvite(dto: AcceptTeamInviteDto) {
    const tokenHash = this.hashToken(dto.token);

    return this.prisma.$transaction(async (tx) => {
      const invite = await tx.teamInvite.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          organizationId: true,
          email: true,
          role: true,
          expiresAt: true,
          acceptedAt: true,
          revokedAt: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!invite) {
        throw new BadRequestException('Invitation invalide');
      }

      if (invite.revokedAt) {
        throw new BadRequestException('Cette invitation a été révoquée');
      }

      if (invite.acceptedAt) {
        throw new BadRequestException('Cette invitation a déjà été acceptée');
      }

      if (invite.expiresAt <= new Date()) {
        throw new BadRequestException('Cette invitation a expiré');
      }

      const existingUser = await tx.user.findUnique({
        where: { email: invite.email },
        select: {
          id: true,
          organizationId: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
        },
      });

      const firstName = this.cleanOptionalValue(dto.firstName);
      const lastName = this.cleanOptionalValue(dto.lastName);
      const password = dto.password?.trim();

      if (
        existingUser?.organizationId &&
        existingUser.organizationId !== invite.organizationId
      ) {
        throw new ConflictException(
          'Ce compte est déjà rattaché à une autre organisation',
        );
      }

      if (!existingUser && !password) {
        throw new BadRequestException(
          'Un mot de passe est requis pour créer votre compte',
        );
      }

      if (existingUser) {
        const updatePayload: Prisma.UserUpdateInput = {
          role: invite.role,
          isActive: true,
        };

        if (!existingUser.organizationId) {
          updatePayload.organization = {
            connect: { id: invite.organizationId },
          };
        }

        if (firstName) {
          updatePayload.firstName = firstName;
        }

        if (lastName) {
          updatePayload.lastName = lastName;
        }

        if (!existingUser.passwordHash) {
          if (!password) {
            throw new BadRequestException(
              'Un mot de passe est requis pour activer votre compte',
            );
          }
          updatePayload.passwordHash = await bcrypt.hash(password, 10);
        }

        await tx.user.update({
          where: { id: existingUser.id },
          data: updatePayload,
        });
      } else {
        const passwordHash = await bcrypt.hash(password!, 10);

        await tx.user.create({
          data: {
            email: invite.email,
            passwordHash,
            firstName,
            lastName,
            role: invite.role,
            organizationId: invite.organizationId,
            isActive: true,
          },
        });
      }

      await tx.teamInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return {
        success: true,
        organizationName: invite.organization.name,
        email: invite.email,
      };
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getFrontendBaseUrl(): string {
    return (
      this.config.get<string>('FRONTEND_URL') ||
      this.config.get<string>('NEXT_PUBLIC_APP_URL') ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  private cleanOptionalValue(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private async ensureAtLeastOneActiveAdmin(
    organizationId: string,
    userIdToExclude?: string,
  ): Promise<void> {
    const activeOrgAdminCount = await this.prisma.user.count({
      where: {
        organizationId,
        isActive: true,
        role: UserRole.ORG_ADMIN,
        ...(userIdToExclude ? { id: { not: userIdToExclude } } : {}),
      },
    });

    if (activeOrgAdminCount < 1) {
      throw new BadRequestException(
        'Au moins un ORG_ADMIN actif est requis dans l\'organisation',
      );
    }
  }
}
