/**
 * Pickup-date rules shared by the payment functions.
 *
 * Mirrors isSepaAllowedForPickupDate in app/lib/helper/Utils.ts: SEPA direct
 * debit takes days to clear, so it is only offered when the pickup is at least
 * five business days out.
 */
const SEPA_MINIMUM_BUSINESS_DAYS = 5;

export const isValidPickupDate = (value: string): boolean =>
	/^\d{4}-\d{2}-\d{2}$/.test(value);

export const isSepaAllowedForPickupDate = (pickupDateStr: string): boolean => {
	if (!isValidPickupDate(pickupDateStr)) {
		return false;
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const pickupDate = new Date(`${pickupDateStr}T00:00:00`);
	pickupDate.setHours(0, 0, 0, 0);

	let businessDays = 0;
	const cursor = new Date(today);
	cursor.setDate(cursor.getDate() + 1); // start counting from tomorrow

	while (cursor <= pickupDate) {
		const day = cursor.getDay();
		if (day !== 0 && day !== 6) { // Mon–Fri only
			businessDays++;
		}
		cursor.setDate(cursor.getDate() + 1);
	}

	return businessDays >= SEPA_MINIMUM_BUSINESS_DAYS;
};

/**
 * The methods a payment session accepts.
 *
 * Card, PayPal and — when the pickup is far enough out — SEPA direct debit.
 * Apple Pay and Google Pay need no entry of their own: both settle as `card`,
 * so including "card" is what makes them available to the Express Checkout
 * Element.
 */
export const paymentMethodTypesForPickupDate = (
	pickupDate: string | undefined,
): string[] =>
	pickupDate && isSepaAllowedForPickupDate(pickupDate)
		? ["card", "paypal", "sepa_debit"]
		: ["card", "paypal"];
