const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export const isPostHogConfigured = Boolean(posthogKey && posthogHost);

type PostHogClient = (typeof import("posthog-js"))["default"];

let posthogPromise: Promise<PostHogClient | null> | null = null;

export async function ensurePostHogInitialized(): Promise<PostHogClient | null> {
  if (!isPostHogConfigured) {
    return null;
  }

  if (!posthogPromise) {
    posthogPromise = import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(posthogKey!, {
          api_host: posthogHost!,
          defaults: "2026-01-30",
          capture_pageview: false,
          disable_session_recording: true,
          disable_surveys: true,
        });

        return posthog;
      })
      .catch(() => null);
  }

  return posthogPromise;
}

export async function capturePostHogEvent(
  eventName: string,
  properties?: Record<string, unknown>,
): Promise<boolean> {
  const posthog = await ensurePostHogInitialized();

  if (!posthog) {
    return false;
  }

  posthog.capture(eventName, properties);
  return true;
}
