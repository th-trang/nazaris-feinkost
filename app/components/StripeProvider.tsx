"use client";

import { ReactNode } from "react";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

/**
 * Default Stripe appearance matching the site's green theme.
 * Override by passing a custom `appearance` prop to `StripeProvider`.
 *
 * @see https://docs.stripe.com/elements/appearance-api
 */
export const defaultAppearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#16a34a",
    colorBackground: "#ffffff",
    colorText: "#111827",
    colorDanger: "#ef4444",
    fontFamily: "Arial, Helvetica, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #e5e7eb",
      boxShadow: "none",
      padding: "12px 16px",
    },
    ".Input:focus": {
      border: "1px solid #16a34a",
      boxShadow: "0 0 0 2px rgba(22,163,74,0.2)",
    },
    ".Label": {
      fontSize: "14px",
      color: "#374151",
    },
  },
};

interface StripeProviderProps {
  clientSecret: string;
  /** Stripe Appearance object – defaults to the site-wide green theme. */
  appearance?: Appearance;
  /** Stripe locale for the Payment Element UI. */
  locale?: "de" | "en";
  children: ReactNode;
}

export default function StripeProvider({
  clientSecret,
  appearance = defaultAppearance,
  locale = "de",
  children,
}: StripeProviderProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
        locale,
      }}
    >
      {children}
    </Elements>
  );
}
