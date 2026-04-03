"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import StripeProvider from "@/app/components/StripeProvider";
import { CheckoutForm } from "./CheckoutForm";

export default function CheckoutPage() {
  const { cartItems, cartTotal } = useCart();
  const searchParams = useSearchParams();
  const params = useParams<{ locale?: string }>();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const redirectStatus = searchParams.get("redirect_status");
  const returnClientSecret = searchParams.get("payment_intent_client_secret");
  const oldStripeStatus = searchParams.get("stripe");
  const isStripeReturn = !!redirectStatus || !!oldStripeStatus;

  useEffect(() => {
    if (returnClientSecret) {
      setClientSecret(returnClientSecret);
      return;
    }

    if (cartTotal <= 0) return;

    const controller = new AbortController();

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: cartTotal }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          if (data.paymentIntentId) {
            setPaymentIntentId(data.paymentIntentId);
          }
        } else {
          setInitError(data.error || "Failed to initialize payment.");
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setInitError("Failed to initialize payment.");
        }
      });

    return () => controller.abort();
  }, [cartTotal, returnClientSecret]);

  useEffect(() => {
    if (cartItems.length === 0 && !isStripeReturn) {
      router.push("/products");
    }
  }, [cartItems.length, isStripeReturn, router]);

  if (cartItems.length === 0 && !isStripeReturn) return null;

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
      <CheckoutForm paymentIntentId={paymentIntentId} />
    </StripeProvider>
  );
}
