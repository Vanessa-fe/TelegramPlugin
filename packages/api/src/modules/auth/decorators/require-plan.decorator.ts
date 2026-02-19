import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PLAN_KEY = 'requirePlan';

/**
 * Decorator to restrict access to specific platform plans.
 * @param plans - List of plan names that have access (e.g., 'growth', 'pro')
 */
export const RequirePlan = (...plans: string[]) =>
  SetMetadata(REQUIRE_PLAN_KEY, plans);
