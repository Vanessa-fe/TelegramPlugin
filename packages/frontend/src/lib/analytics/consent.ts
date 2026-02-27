const ANALYTICS_CONSENT_COOKIE = process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_COOKIE;
const ANALYTICS_CONSENT_VALUE = process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_VALUE;

const FALLBACK_ANALYTICS_CONSENT_COOKIES = [
  "cm_consent",
  "cmpconsent",
  "cookie_consent",
  "cookieconsent_status",
  "analytics_consent",
];

const ACCEPTED_VALUES = new Set([
  "1",
  "true",
  "yes",
  "allow",
  "allowed",
  "accept",
  "accepted",
  "granted",
]);

function normalizeValue(value: string): string {
  try {
    return decodeURIComponent(value).trim().toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));

  return match?.[1] ?? null;
}

function hasAffirmativeConsent(value: string): boolean {
  const normalized = normalizeValue(value);

  if (ACCEPTED_VALUES.has(normalized)) {
    return true;
  }

  if (
    (normalized.includes("analytics") || normalized.includes("stat")) &&
    (normalized.includes("true") ||
      normalized.includes(":1") ||
      normalized.includes("=1") ||
      normalized.includes("granted") ||
      normalized.includes("allow") ||
      normalized.includes("accept"))
  ) {
    return true;
  }

  return false;
}

export function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  if (ANALYTICS_CONSENT_COOKIE) {
    const configuredCookieValue = readCookieValue(ANALYTICS_CONSENT_COOKIE);

    if (!configuredCookieValue) {
      return false;
    }

    if (!ANALYTICS_CONSENT_VALUE) {
      return hasAffirmativeConsent(configuredCookieValue);
    }

    return (
      normalizeValue(configuredCookieValue) ===
      ANALYTICS_CONSENT_VALUE.trim().toLowerCase()
    );
  }

  return FALLBACK_ANALYTICS_CONSENT_COOKIES.some((cookieName) => {
    const cookieValue = readCookieValue(cookieName);

    if (!cookieValue) {
      return false;
    }

    return hasAffirmativeConsent(cookieValue);
  });
}
