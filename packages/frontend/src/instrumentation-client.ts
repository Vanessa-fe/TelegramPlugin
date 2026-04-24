import posthog from "posthog-js";

const posthogKey =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const SENSITIVE_URL_PARAMS = new Set([
  "token",
  "code",
  "state",
  "access_token",
  "refresh_token",
  "id_token",
]);

function sanitizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl, window.location.origin);

    SENSITIVE_URL_PARAMS.forEach((param) => {
      url.searchParams.delete(param);
    });

    if (url.hash) {
      const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
      const hashParams = new URLSearchParams(hash);
      let hashChanged = false;

      SENSITIVE_URL_PARAMS.forEach((param) => {
        if (hashParams.has(param)) {
          hashParams.delete(param);
          hashChanged = true;
        }
      });

      url.hash = hashChanged ? hashParams.toString() : url.hash;
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

function sanitizeEventProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized = { ...properties };

  ["$current_url", "$pathname"].forEach((key) => {
    const value = sanitized[key];
    if (typeof value === "string") {
      sanitized[key] = sanitizeUrl(value);
    }
  });

  return sanitized;
}

if (posthogKey && posthogHost) {
  try {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      defaults: "2026-01-30",
      before_send: (event) => {
        if (!event) {
          return event;
        }

        event.properties = sanitizeEventProperties(
          (event.properties as Record<string, unknown> | undefined) ?? {},
        );

        return event;
      },
    });
  } catch {
    // Prevent analytics boot failures from affecting app startup.
  }
}
