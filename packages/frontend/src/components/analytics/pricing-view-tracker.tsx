'use client';

import { useEffect } from "react";

import { Analytics } from "@/lib/analytics/events";

export function PricingViewTracker() {
  useEffect(() => {
    Analytics.pricingViewed();
  }, []);

  return null;
}
