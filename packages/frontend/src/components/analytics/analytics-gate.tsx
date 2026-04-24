'use client';

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  hasAnalyticsConsent,
  persistAnalyticsConsent,
} from "@/lib/analytics/consent";
import { Analytics } from "@/lib/analytics/events";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const isInternalEnvironment = process.env.NEXT_PUBLIC_IS_INTERNAL === "true";

type CmpEventHandler = () => void;

type CmpApi = (
  command: string,
  parameter?: unknown,
  callback?: unknown,
  async?: unknown,
) => unknown;

declare global {
  interface Window {
    __cmp?: CmpApi;
  }
}

export function AnalyticsGate() {
  const [isConsentGranted, setIsConsentGranted] = useState(false);

  useEffect(() => {
    const refreshConsent = () => {
      if (hasAnalyticsConsent()) {
        setIsConsentGranted(true);
      }
    };

    let isCmpListenerRegistered = false;
<<<<<<< HEAD
    const cmpListeners: Array<{ eventName: string; handler: CmpEventHandler }> =
      [];
=======
    const cmpListeners: Array<{ eventName: string; handler: CmpEventHandler }> = [];
>>>>>>> master

    const tryRegisterCmpListeners = () => {
      if (isCmpListenerRegistered) {
        return;
      }

      const cmp = window.__cmp;

      if (typeof cmp !== "function") {
        return;
      }

      isCmpListenerRegistered = true;

      const onConsentApproved = () => {
        persistAnalyticsConsent(true);
        setIsConsentGranted(true);
      };

      const onConsentRejected = () => {
        persistAnalyticsConsent(false);
      };

      const onConsentChanged = () => {
        const consentGranted = hasAnalyticsConsent();
        persistAnalyticsConsent(consentGranted);

        if (consentGranted) {
          setIsConsentGranted(true);
        }
      };

      const listeners: Array<{ eventName: string; handler: CmpEventHandler }> = [
        { eventName: "consentapproved", handler: onConsentApproved },
        { eventName: "consentrejected", handler: onConsentRejected },
        { eventName: "consentcustom", handler: onConsentChanged },
        { eventName: "consent", handler: onConsentChanged },
      ];

      listeners.forEach(({ eventName, handler }) => {
        cmp("addEventListener", [eventName, handler, false], null);
        cmpListeners.push({ eventName, handler });
      });
    };

    refreshConsent();
    tryRegisterCmpListeners();

    const cmpPollId = window.setInterval(tryRegisterCmpListeners, 500);
    const intervalId = window.setInterval(refreshConsent, 1500);
    window.addEventListener("focus", refreshConsent);
    document.addEventListener("visibilitychange", refreshConsent);

    return () => {
      const cmp = window.__cmp;

      if (typeof cmp === "function") {
        cmpListeners.forEach(({ eventName, handler }) => {
          cmp("removeEventListener", [eventName, handler, false], null);
        });
      }

      window.clearInterval(cmpPollId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshConsent);
      document.removeEventListener("visibilitychange", refreshConsent);
    };
  }, []);

  useEffect(() => {
    if (!isConsentGranted || !isInternalEnvironment) {
      return;
    }

    Analytics.identifyInternal();
  }, [isConsentGranted]);

  if (!isConsentGranted) {
    return null;
  }

  return (
    <>
      {GTM_ID && (
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
      )}
    </>
  );
}
