'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { hasAnalyticsConsent } from '@/lib/analytics/consent';
import { capturePostHogEvent, isPostHogConfigured } from '@/lib/analytics/posthog';

export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isPostHogConfigured || !hasAnalyticsConsent()) {
      return;
    }

    const search = searchParams.toString();
    const url = `${window.location.origin}${pathname}${search ? `?${search}` : ''}`;

    void capturePostHogEvent('$pageview', {
      $current_url: url,
    });
  }, [pathname, searchParams]);

  return null;
}
