'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'auto';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () =>
        window.turnstile
          ? resolve(window.turnstile)
          : reject(new Error('Turnstile unavailable'));
      script.onerror = () => {
        scriptPromise = null;
        script.remove();
        reject(new Error('Turnstile failed to load'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export type TurnstileWidgetHandle = {
  /** Tokens are single-use: call after every submission attempt. */
  reset: () => void;
};

type Props = {
  siteKey: string;
  action: string;
  language?: string;
  /** Receives a fresh token, or null once it expired or the check failed. */
  onToken: (token: string | null) => void;
  onError?: () => void;
};

/** Cloudflare Turnstile anti-bot check (usually invisible to real visitors). */
export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, Props>(
  function TurnstileWidget({ siteKey, action, language, onToken, onError }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const callbacksRef = useRef({ onToken, onError });
    callbacksRef.current = { onToken, onError };

    useImperativeHandle(ref, () => ({
      reset() {
        callbacksRef.current.onToken(null);
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      let cancelled = false;

      loadTurnstile()
        .then((turnstile) => {
          if (cancelled || !containerRef.current) return;
          widgetIdRef.current = turnstile.render(containerRef.current, {
            sitekey: siteKey,
            action,
            language,
            theme: 'light',
            callback: (token) => callbacksRef.current.onToken(token),
            'expired-callback': () => callbacksRef.current.onToken(null),
            'error-callback': () => {
              callbacksRef.current.onToken(null);
              callbacksRef.current.onError?.();
            },
          });
        })
        .catch(() => {
          if (!cancelled) callbacksRef.current.onError?.();
        });

      return () => {
        cancelled = true;
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
        widgetIdRef.current = null;
      };
    }, [siteKey, action, language]);

    return <div ref={containerRef} className="min-h-[65px]" />;
  },
);
