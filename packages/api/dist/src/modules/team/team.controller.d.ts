import type { AuthUser } from '../auth/auth.types';
import type { AcceptTeamInviteDto, CreateTeamInviteDto, UpdateTeamMemberRoleDto } from './team.schema';
import { TeamService } from './team.service';
export declare class TeamController {
    private readonly teamService;
    constructor(teamService: TeamService);
    listMembers(user: AuthUser, organizationId?: string): Promise<import("./team.service").TeamMemberDto[]>;
    updateMemberRole(user: AuthUser, id: string, body: UpdateTeamMemberRoleDto, organizationId?: string): Promise<import("./team.service").TeamMemberDto>;
    deactivateMember(user: AuthUser, id: string, organizationId?: string): Promise<import("./team.service").TeamMemberDto>;
    reactivateMember(user: AuthUser, id: string, organizationId?: string): Promise<import("./team.service").TeamMemberDto>;
    removeMember(user: AuthUser, id: string, organizationId?: string): Promise<{
        success: true;
    }>;
    listInvites(user: AuthUser, organizationId?: string): Promise<import("./team.service").TeamInviteDto[]>;
    createInvite(user: AuthUser, body: CreateTeamInviteDto): Promise<{
        inviteUrl: string;
        id: string;
        email: string;
        createdAt: Date;
        expiresAt: Date;
        role: import("@prisma/client").$Enums.UserRole;
    }>;
    revokeInvite(user: AuthUser, id: string, organizationId?: string): Promise<{
        success: boolean;
    }>;
    getPublicInvite(token: string): Promise<import("./team.service").TeamPublicInviteDto>;
    acceptInvite(body: AcceptTeamInviteDto): Promise<{
        success: boolean;
        organizationName: string;
        email: string;
    }>;
}
