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
  currency?: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
  verificationRequired: boolean;
}

export interface UpdateProfileData {
  email?: string;
  firstName?: string;
  lastName?: string;
  currentPassword?: string;
}

export interface UpdatePasswordData {
  currentPassword?: string;
  newPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface VerifyEmailData {
  token: string;
}

export interface ResendVerificationData {
  email: string;
}
