"use client";

import { CheckoutPageContent } from "@/components/checkout/checkout-page";
import { storefrontApi } from "@/lib/api/storefront";
import { useParams } from "next/navigation";

export default function CheckoutProductSlugPage() {
  const params = useParams();
  const organizationSlug = params.slug as string;
  const productSlug = params.productSlug as string;

  return (
    <CheckoutPageContent
      fetchProduct={() =>
        storefrontApi.getProductBySlug(organizationSlug, productSlug)
      }
    />
  );
}
