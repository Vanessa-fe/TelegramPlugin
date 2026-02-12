import { UserRole } from './auth';

export type TeamManageableRole =
  | UserRole.ORG_ADMIN
  | UserRole.SUPPORT
  | UserRole.VIEWER;

export interface TeamMember {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: TeamManageableRole;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export interface CreatedTeamInvite {
  id: string;
  email: string;
  role: TeamManageableRole;
  expiresAt: string;
  createdAt: string;
  inviteUrl: string;
}

export interface CreateTeamInviteDto {
  organizationId?: string;
  email: string;
  role: TeamManageableRole;
}

export interface UpdateTeamMemberRoleDto {
  role: TeamManageableRole;
}

export type TeamPublicInvite =
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
      expiresAt: string;
    };

export interface AcceptTeamInviteDto {
  token: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

export interface TeamActionSuccess {
  success: boolean;
}
