"use client";

import { CheckoutPageContent } from "@/components/checkout/checkout-page";
import { storefrontApi } from "@/lib/api/storefront";
import { useParams } from "next/navigation";

export default function CheckoutPage() {
  const params = useParams();
  const productId = params.slug as string;

  return (
    <CheckoutPageContent
      fetchProduct={() => storefrontApi.getProduct(productId)}
    />
  );
}
