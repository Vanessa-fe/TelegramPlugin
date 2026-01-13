export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  SUPPORT = 'SUPPORT',
  VIEWER = 'VIEWER',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
}
