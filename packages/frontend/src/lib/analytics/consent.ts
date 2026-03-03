const ANALYTICS_CONSENT_COOKIE = process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_COOKIE;
const ANALYTICS_CONSENT_VALUE = process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_VALUE;
const ANALYTICS_CONSENT_STORAGE_KEY = "sublynk_analytics_consent";

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

function readStoredAnalyticsConsent(): boolean | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);

    if (storedValue === "granted") {
      return true;
    }

    if (storedValue === "denied") {
      return false;
    }
  } catch {
    // Ignore storage access errors (private mode, blocked storage, etc.)
  }

  return null;
}

function resolveConfiguredConsentCookie(): boolean | null {
  if (!ANALYTICS_CONSENT_COOKIE) {
    return null;
  }

  const configuredCookieValue = readCookieValue(ANALYTICS_CONSENT_COOKIE);

  if (!configuredCookieValue) {
    return false;
  }

  if (!ANALYTICS_CONSENT_VALUE) {
    return hasAffirmativeConsent(configuredCookieValue);
  }

  const normalizedCookieValue = normalizeValue(configuredCookieValue);
  const expectedValue = ANALYTICS_CONSENT_VALUE.trim().toLowerCase();

  if (normalizedCookieValue === expectedValue) {
    return true;
  }

  if (hasAffirmativeConsent(configuredCookieValue)) {
    return true;
  }

  // CMP values can evolve over time; a mismatch is inconclusive.
  return null;
}

export function persistAnalyticsConsent(value: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ANALYTICS_CONSENT_STORAGE_KEY,
      value ? "granted" : "denied",
    );
  } catch {
    // Ignore storage access errors (private mode, blocked storage, etc.)
  }
}

export function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const storedConsent = readStoredAnalyticsConsent();

  if (storedConsent === false) {
    return false;
  }

  if (storedConsent === true) {
    return true;
  }

  const configuredCookieConsent = resolveConfiguredConsentCookie();

  if (configuredCookieConsent !== null) {
    return configuredCookieConsent;
  }

  const fallbackConsent = FALLBACK_ANALYTICS_CONSENT_COOKIES.some((cookieName) => {
    const cookieValue = readCookieValue(cookieName);

    if (!cookieValue) {
      return false;
    }

    return hasAffirmativeConsent(cookieValue);
  });

  if (fallbackConsent) {
    return true;
  }

  return false;
}
