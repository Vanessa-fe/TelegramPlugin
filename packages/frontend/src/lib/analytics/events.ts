import posthog from "posthog-js";

type CommunityPlatform = "telegram" | "discord" | "whatsapp";
const isPostHogConfigured =
  Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
      process.env.NEXT_PUBLIC_POSTHOG_KEY,
  ) && Boolean(process.env.NEXT_PUBLIC_POSTHOG_HOST);

function withPostHog(callback: (client: typeof posthog) => void): void {
  if (!isPostHogConfigured) {
    return;
  }

  try {
    callback(posthog);
  } catch {
    // Analytics must never interrupt a user action such as login or checkout.
  }
}

export const Analytics = {
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
  planSelected: (properties: {
    plan: string;
    price?: number;
    currency?: string;
    source?: string;
  }) => {
    withPostHog((posthog) => {
      posthog.capture("plan_selected", properties, { send_instantly: true });
    });
  },
  identifyInternal: () => {
    withPostHog((posthog) => {
      posthog.setPersonProperties({ is_internal: true });
    });
  },
};
