import {HttpsError} from "firebase-functions/v2/https";
import {roundCurrency} from "./money.js";
import {assertValidCartLines} from "./pricing.js";
import type {CreateOrderInput} from "./types.js";

export {roundCurrency};

export const validateEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const sanitizeName = (value: string): string =>
	value.trim().replace(/\s+/g, " ");

export const validatePhone = (phone: string): boolean => {
	const phoneRegex = /^\+?[\d\s-]+$/;
	return phoneRegex.test(phone) && phone.replace(/[\s-]/g, "").length >= 6;
};

/**
 * Validates the customer and pickup details and the *shape* of the cart.
 * Deliberately no prices or product names: those are resolved from the
 * Firestore catalog in createOrder, so nothing a client sends can affect
 * what an order costs.
 */
export const assertValidCreateOrderPayload = (
	payload: unknown,
): CreateOrderInput => {
	if (!payload || typeof payload !== "object") {
		throw new HttpsError("invalid-argument", "Invalid payload.");
	}

	const parsed = payload as Partial<CreateOrderInput>;

	const firstName = sanitizeName(parsed.firstName ?? "");
	const lastName = sanitizeName(parsed.lastName ?? "");
	const email = (parsed.email ?? "").trim().toLowerCase();
	const phone = (parsed.phone ?? "").trim();
	const pickupDate = (parsed.pickupDate ?? "").trim();
	const pickupLocation = (parsed.pickupLocation ?? "").trim();
	const specialRequests = (parsed.specialRequests ?? "").trim();
	const paymentMethod = parsed.paymentMethod;

	if (!firstName || !lastName) {
		throw new HttpsError(
			"invalid-argument",
			"First and last name are required.",
		);
	}

	if (!validateEmail(email)) {
		throw new HttpsError("invalid-argument", "Invalid email format.");
	}

	if (!validatePhone(phone)) {
		throw new HttpsError("invalid-argument", "Invalid phone format.");
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
		throw new HttpsError(
			"invalid-argument",
			"Pickup date must be YYYY-MM-DD.",
		);
	}

	if (!pickupLocation) {
		throw new HttpsError(
			"invalid-argument",
			"Pickup location is required.",
		);
	}

	if (paymentMethod !== "card" && paymentMethod !== "paypal" && paymentMethod !== "sepa_debit") {
		throw new HttpsError("invalid-argument", "Invalid payment method.");
	}

	return {
		firstName,
		lastName,
		email,
		phone,
		pickupDate,
		pickupLocation,
		specialRequests,
		paymentMethod,
		paymentIntentId: typeof parsed.paymentIntentId === "string" && parsed.paymentIntentId.trim()
			? parsed.paymentIntentId.trim()
			: undefined,
		items: assertValidCartLines(parsed.items),
	};
};
