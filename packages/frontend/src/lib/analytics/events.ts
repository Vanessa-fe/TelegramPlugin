import posthog from "posthog-js";

const isPostHogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY,
) && Boolean(process.env.NEXT_PUBLIC_POSTHOG_HOST);

type CommunityPlatform = "telegram" | "discord" | "whatsapp";

function withPostHog(callback: (client: typeof posthog) => void): void {
  if (!isPostHogConfigured) {
    return;
  }

  callback(posthog);
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
