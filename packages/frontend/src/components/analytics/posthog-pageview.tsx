'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';

const isPostHogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasSentBootEvent = useRef(false);

  useEffect(() => {
    if (!isPostHogConfigured) {
      return;
    }

    const search = searchParams.toString();
    const url = `${window.location.origin}${pathname}${search ? `?${search}` : ''}`;

    posthog.capture('$pageview', {
      $current_url: url,
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isPostHogConfigured || hasSentBootEvent.current) {
      return;
    }

    posthog.capture('posthog_initialized');
    hasSentBootEvent.current = true;
  }, []);

  return null;
}
