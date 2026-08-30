"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import StripeProvider from "@/app/components/StripeProvider";
import { CheckoutForm } from "./CheckoutForm";
import { createPaymentIntent } from "@/app/lib/firebase/payments";
import { toCartLines } from "@/app/lib/checkout/cartLines";

export default function CheckoutPage() {
  const { cartItems, cartTotal, cartPricingError } = useCart();
  const searchParams = useSearchParams();
  const params = useParams<{ locale?: string }>();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isCheckoutComplete, setIsCheckoutComplete] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const redirectStatus = searchParams.get("redirect_status");
  const returnClientSecret = searchParams.get("payment_intent_client_secret");
  const oldStripeStatus = searchParams.get("stripe");
  const refKey = searchParams.get("ref");
  const isStripeReturn = !!redirectStatus || !!returnClientSecret || !!oldStripeStatus || !!refKey;

  useEffect(() => {
    if (isCheckoutComplete) return;

    if (returnClientSecret) {
      setClientSecret(returnClientSecret);
      return;
    }

    if (cartPricingError) {
      setInitError(cartPricingError);
      return;
    }

    if (!isStripeReturn && cartTotal <= 0) {
      setInitError("Cart total must be greater than zero.");
      return;
    }

    // Nothing to price yet — the effect below sends the visitor to /products.
    if (cartItems.length === 0) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // The amount is derived from the catalog by the backend; we only say what
    // is in the cart.
    let cancelled = false;

    createPaymentIntent({
      items: toCartLines(cartItems),
      pickupDate: tomorrowStr,
    })
      .then((session) => {
        if (cancelled) return;
        setClientSecret(session.clientSecret);
        setPaymentIntentId(session.paymentIntentId);
        setExpiresAt(session.expiresAt);
      })
      .catch((err) => {
        if (cancelled) return;
        setInitError(
          err instanceof Error && err.message
            ? err.message
            : "Failed to initialize payment.",
        );
      });

    return () => {
      cancelled = true;
    };
    // cartItems is intentionally read, not tracked: re-running on every cart
    // edit would open a new payment session mid-checkout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartPricingError, cartTotal, isStripeReturn, isCheckoutComplete, returnClientSecret, retryKey]);

  useEffect(() => {
    if (cartItems.length === 0 && !isStripeReturn && !isCheckoutComplete) {
      router.push("/products");
    }
  }, [cartItems.length, isStripeReturn, isCheckoutComplete, router]);

  if (cartItems.length === 0 && !isStripeReturn && !isCheckoutComplete) return null;

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <p className="text-red-600">{initError}</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    );
  }

  const locale =
    (Array.isArray(params.locale) ? params.locale[0] : params.locale) === "en"
      ? "en"
      : "de";

  return (
    <StripeProvider clientSecret={clientSecret} locale={locale}>
      <CheckoutForm 
      paymentIntentId={paymentIntentId} 
      clientSecret={clientSecret}
      expiresAt={expiresAt} 
      onSuccess={() => setIsCheckoutComplete(true)} 
      onPaymentFailed={() => setRetryKey(k => k + 1)}
      />
    </StripeProvider>
  );
}
