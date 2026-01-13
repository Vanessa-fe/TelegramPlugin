import type { AuthUser } from '../auth.types';
export declare function resolveOrganizationScope(user: AuthUser, requestedOrganizationId?: string | null): string | undefined;
