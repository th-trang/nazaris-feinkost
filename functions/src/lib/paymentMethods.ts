/**
 * Payment methods offered at checkout.
 *
 * Apple Pay and Google Pay are wallets rather than payment method types of
 * their own: Stripe settles both as `card`, so enabling "card" is what makes
 * them available. They only become distinguishable once the charge exists,
 * which is where the webhook picks them up — hence the two sets below.
 */

/** What the checkout form itself can declare. */
export type PaymentMethod = "card" | "paypal" | "sepa_debit";

/** What a completed payment can turn out to have been. */
export type ResolvedPaymentMethod =
	| PaymentMethod
	| "google_pay"
	| "apple_pay";

export const PAYMENT_METHOD_MAP: Record<string, string> = {
	card: "card",
	paypal: "paypal",
	sepa_debit: "sepa_debit",
	google_pay: "google_pay",
	apple_pay: "apple_pay",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
	card: "Karte",
	paypal: "PayPal",
	sepa_debit: "SEPA-Lastschrift",
	google_pay: "Google Pay",
	apple_pay: "Apple Pay",
};

export const paymentMethodLabel = (method: string): string =>
	PAYMENT_METHOD_LABELS[method] ?? method;
