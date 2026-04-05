import { ensurePostHogInitialized, getPostHog } from "@/lib/analytics/posthog";

type CommunityPlatform = "telegram" | "discord" | "whatsapp";
type PostHogInstance = NonNullable<ReturnType<typeof getPostHog>>;

function withPostHog(callback: (posthog: PostHogInstance) => void): void {
  const posthog = getPostHog();

  if (posthog) {
    callback(posthog);
    return;
  }

  void ensurePostHogInitialized().then((initializedPostHog) => {
    if (initializedPostHog) {
      callback(initializedPostHog);
    }
  });
}

export const Analytics = {
  userSignedUp: (properties?: { plan?: string }) => {
    withPostHog((posthog) => {
      posthog.capture("user_signed_up", properties);
    });
  },
  userLoggedIn: () => {
    withPostHog((posthog) => {
      posthog.capture("user_logged_in");
    });
  },
  communityCreated: (properties: { platform: CommunityPlatform }) => {
    withPostHog((posthog) => {
      posthog.capture("community_created", properties);
    });
  },
  pricingViewed: () => {
    withPostHog((posthog) => {
      posthog.capture("pricing_viewed");
    });
  },
  planSelected: (properties: { plan: string; price: number }) => {
    withPostHog((posthog) => {
      posthog.capture("plan_selected", properties);
    });
  },
  identifyInternal: () => {
    withPostHog((posthog) => {
      posthog.setPersonProperties({ is_internal: true });
    });
  },
};
