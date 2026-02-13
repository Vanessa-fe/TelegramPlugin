import type { Affiliate } from "@/types/affiliate";

const INTERNAL_AFFILIATE_EMAIL_DOMAIN = "@sublynk.local";

export function isInternalAffiliateEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(INTERNAL_AFFILIATE_EMAIL_DOMAIN);
}

export function getVisibleAffiliateEmail(email?: string | null): string | null {
  if (!email || isInternalAffiliateEmail(email)) {
    return null;
  }
  return email;
}

export function getAffiliateDisplayLabel(
  affiliate: Pick<Affiliate, "name" | "email" | "referralCode">
): string {
  return affiliate.name || getVisibleAffiliateEmail(affiliate.email) || affiliate.referralCode;
}
