const AFFILIATE_CODE_KEY = 'sublynk_affiliate_code';
const AFFILIATE_CLICK_ID_KEY = 'sublynk_affiliate_click_id';
const VISITOR_ID_KEY = 'sublynk_visitor_id';
const EXPIRATION_DAYS = 30;

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function setLocalStorage(key: string, value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage might be blocked
  }
}

function getLocalStorage(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getVisitorId(): string {
  let visitorId = getCookie(VISITOR_ID_KEY) || getLocalStorage(VISITOR_ID_KEY);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    setCookie(VISITOR_ID_KEY, visitorId, 365);
    setLocalStorage(VISITOR_ID_KEY, visitorId);
  }

  return visitorId;
}

export function storeAffiliateCode(code: string): void {
  setCookie(AFFILIATE_CODE_KEY, code, EXPIRATION_DAYS);
  setLocalStorage(AFFILIATE_CODE_KEY, code);
}

export function getStoredAffiliateCode(): string | null {
  return getCookie(AFFILIATE_CODE_KEY) || getLocalStorage(AFFILIATE_CODE_KEY);
}

export function storeAffiliateClickId(clickId: string): void {
  setCookie(AFFILIATE_CLICK_ID_KEY, clickId, EXPIRATION_DAYS);
  setLocalStorage(AFFILIATE_CLICK_ID_KEY, clickId);
}

export function getStoredAffiliateClickId(): string | null {
  return (
    getCookie(AFFILIATE_CLICK_ID_KEY) || getLocalStorage(AFFILIATE_CLICK_ID_KEY)
  );
}

export function clearAffiliateData(): void {
  setCookie(AFFILIATE_CODE_KEY, '', -1);
  setCookie(AFFILIATE_CLICK_ID_KEY, '', -1);
  setLocalStorage(AFFILIATE_CODE_KEY, '');
  setLocalStorage(AFFILIATE_CLICK_ID_KEY, '');
}

export function getAffiliateCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('ref') || params.get('affiliate') || params.get('aff');
}

export interface AffiliateTrackingData {
  affiliateCode: string | null;
  clickId: string | null;
  visitorId: string;
}

export function getAffiliateTrackingData(): AffiliateTrackingData {
  return {
    affiliateCode: getStoredAffiliateCode(),
    clickId: getStoredAffiliateClickId(),
    visitorId: getVisitorId(),
  };
}
