import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { AuthUser } from '../auth.types';

export function resolveOrganizationScope(
  user: AuthUser,
  requestedOrganizationId?: string | null,
): string | undefined {
  if (user.role === UserRole.SUPERADMIN) {
    return requestedOrganizationId ?? undefined;
  }

  if (!user.organizationId) {
    throw new ForbiddenException(
      'Ce compte n’est associé à aucune organisation',
    );
  }

  if (
    requestedOrganizationId &&
    requestedOrganizationId !== user.organizationId
  ) {
    throw new ForbiddenException(
      'Organisation non accessible pour cet utilisateur',
    );
  }

  return user.organizationId;
}
