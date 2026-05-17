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
    if (returnClientSecret) {
      setClientSecret(returnClientSecret);
      return;
    }

    if (cartTotal <= 0) return;

    const controller = new AbortController();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: cartTotal, pickupDate: tomorrowStr }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Payment Intent Response:", data);
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          console.log("Client Secret set:", data.clientSecret);
          if (data.paymentIntentId)  setPaymentIntentId(data.paymentIntentId);
          if (data.expiresAt)  setExpiresAt(data.expiresAt);
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
  }, [cartTotal, returnClientSecret, retryKey]);

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
      expiresAt={expiresAt} 
      onSuccess={() => setIsCheckoutComplete(true)} 
      onPaymentFailed={() => setRetryKey(k => k + 1)}
      />
    </StripeProvider>
  );
}
