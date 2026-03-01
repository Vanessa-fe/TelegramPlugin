import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AcceptTeamInviteDto, CreateTeamInviteDto, UpdateTeamMemberRoleDto } from './team.schema';
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
export type TeamPublicInviteDto = {
    valid: false;
    reason: 'invalid' | 'expired' | 'accepted' | 'revoked';
    message: string;
} | {
    valid: true;
    organizationName: string;
    email: string;
    role: UserRole;
    expiresAt: Date;
};
export declare class TeamService {
    private readonly prisma;
    private readonly config;
    private readonly notifications;
    constructor(prisma: PrismaService, config: ConfigService, notifications: NotificationsService);
    listMembers(organizationId: string): Promise<TeamMemberDto[]>;
    listPendingInvites(organizationId: string): Promise<TeamInviteDto[]>;
    createInvite(organizationId: string, invitedByUserId: string, dto: CreateTeamInviteDto): Promise<{
        inviteUrl: string;
        id: string;
        createdAt: Date;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        expiresAt: Date;
    }>;
    revokeInvite(organizationId: string, inviteId: string): Promise<{
        success: boolean;
    }>;
    updateMemberRole(organizationId: string, memberId: string, actorUserId: string, dto: UpdateTeamMemberRoleDto): Promise<TeamMemberDto>;
    deactivateMember(organizationId: string, memberId: string, actorUserId: string): Promise<TeamMemberDto>;
    reactivateMember(organizationId: string, memberId: string): Promise<TeamMemberDto>;
    removeMember(organizationId: string, memberId: string, actorUserId: string): Promise<{
        success: true;
    }>;
    getPublicInvite(token: string): Promise<TeamPublicInviteDto>;
    acceptInvite(dto: AcceptTeamInviteDto): Promise<{
        success: boolean;
        organizationName: string;
        email: string;
    }>;
    private hashToken;
    private getFrontendBaseUrl;
    private cleanOptionalValue;
    private ensureAtLeastOneActiveAdmin;
}
