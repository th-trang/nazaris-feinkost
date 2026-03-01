import {HttpsError} from "firebase-functions/v2/https";
import type {CreateOrderInput, OrderItemInput} from "./types.js";

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

export const roundCurrency = (amount: number): number =>
	Math.round((amount + Number.EPSILON) * 100) / 100;

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
	const items = parsed.items;

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

	if (paymentMethod !== "card" && paymentMethod !== "paypal") {
		throw new HttpsError("invalid-argument", "Invalid payment method.");
	}

	if (!Array.isArray(items) || items.length === 0) {
		throw new HttpsError(
			"invalid-argument",
			"At least one item is required.",
		);
	}

	const sanitizedItems: OrderItemInput[] = items.map((item) => {
		if (!item || typeof item !== "object") {
			throw new HttpsError("invalid-argument", "Order item is invalid.");
		}

		const parsedItem = item as Partial<OrderItemInput>;
		const id = (parsedItem.id ?? "").trim();
		const name = (parsedItem.name ?? "").trim();
		const quantity = Number(parsedItem.quantity ?? 0);
		const unitPrice = Number(parsedItem.unitPrice ?? -1);
		const rawWeight = parsedItem.weightInGrams;

		if (!id || !name) {
			throw new HttpsError(
				"invalid-argument",
				"Order item id and name are required.",
			);
		}

		if (!Number.isInteger(quantity) || quantity <= 0) {
			throw new HttpsError(
				"invalid-argument",
				"Order item quantity must be a positive integer.",
			);
		}

		if (!Number.isFinite(unitPrice) || unitPrice < 0) {
			throw new HttpsError(
				"invalid-argument",
				"Order item unit price must be non-negative.",
			);
		}

		let weightInGrams: number | undefined;
		if (rawWeight !== undefined && rawWeight !== null) {
			const w = Number(rawWeight);
			if (!Number.isInteger(w) || w <= 0) {
				throw new HttpsError(
					"invalid-argument",
					"Order item weightInGrams must be a positive integer when provided.",
				);
			}
			weightInGrams = w;
		}

		const result: OrderItemInput = {
			id,
			name,
			quantity,
			unitPrice: roundCurrency(unitPrice),
		};
		if (weightInGrams !== undefined) {
			result.weightInGrams = weightInGrams;
		}
		return result;
	});

	return {
		firstName,
		lastName,
		email,
		phone,
		pickupDate,
		pickupLocation,
		specialRequests,
		paymentMethod,
		items: sanitizedItems,
	};
};
