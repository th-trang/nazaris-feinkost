/**
 * Currency helpers.
 *
 * Kept in its own module so both the pricing engine and the payload
 * validators can use it without importing each other.
 */
export const CURRENCY = "EUR";

export const roundCurrency = (amount: number): number =>
	Math.round((amount + Number.EPSILON) * 100) / 100;

/** Stripe works in minor units — cents for EUR. */
export const toMinorUnits = (amount: number): number =>
	Math.round(roundCurrency(amount) * 100);
