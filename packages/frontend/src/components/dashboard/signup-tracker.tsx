'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

/**
 * Tracks OAuth signup events for GTM.
 * When ?signup=google is present in URL, fires registration_success event
 * and cleans up the URL.
 */
export function SignupTracker() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const signupMethod = searchParams.get('signup');

    if (signupMethod && typeof window !== 'undefined') {
      // Fire GTM event
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'registration_success',
          method: signupMethod,
        });
      }

      // Clean up URL (remove ?signup param)
      const url = new URL(window.location.href);
      url.searchParams.delete('signup');
      router.replace(url.pathname, { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
