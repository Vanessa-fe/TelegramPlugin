import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformSubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AuthUser } from '../auth.types';
import { REQUIRE_PLAN_KEY } from '../decorators/require-plan.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip for public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPlans = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no plan requirement, allow access
    if (!requiredPlans || requiredPlans.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    if (!user.organizationId) {
      throw new ForbiddenException('Organisation non trouvée');
    }

    // Get the organization's platform subscription
    const subscription = await this.prisma.platformSubscription.findUnique({
      where: { organizationId: user.organizationId },
      include: { platformPlan: true },
    });

    if (!subscription) {
      throw new ForbiddenException(
        'Cette fonctionnalité nécessite un abonnement. Veuillez choisir un plan.',
      );
    }

    // Check if subscription is active
    const isActive =
      subscription.status === PlatformSubscriptionStatus.ACTIVE ||
      subscription.status === PlatformSubscriptionStatus.TRIALING;

    // Check grace period
    const isInGracePeriod =
      subscription.graceUntil && subscription.graceUntil > new Date();

    // Check if grandfathered
    const metadata = subscription.metadata as Record<string, unknown> | null;
    const isGrandfathered = metadata?.grandfathered === true;

    if (!isActive && !isInGracePeriod && !isGrandfathered) {
      throw new ForbiddenException(
        "Votre abonnement n'est pas actif. Veuillez renouveler votre abonnement.",
      );
    }

    const currentPlanName = subscription.platformPlan?.name;

    if (!currentPlanName) {
      throw new ForbiddenException('Plan non trouvé');
    }

    // Grandfathered users have access to all features
    if (isGrandfathered) {
      return true;
    }

    // Check if user's plan is in the required plans
    if (!requiredPlans.includes(currentPlanName)) {
      const planNames = requiredPlans.join(' ou ');
      throw new ForbiddenException(
        `Cette fonctionnalité nécessite un plan ${planNames}. Votre plan actuel est ${currentPlanName}.`,
      );
    }

    return true;
  }
}
