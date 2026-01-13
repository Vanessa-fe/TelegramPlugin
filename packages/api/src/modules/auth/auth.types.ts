import type { UserRole } from '@prisma/client';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthProfile {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AuthResult extends AuthTokens {
  user: AuthProfile;
}
