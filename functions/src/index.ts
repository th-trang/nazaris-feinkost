import {getApps, initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";

setGlobalOptions({maxInstances: 10, region: "europe-west3"});

if (!getApps().length) {
	initializeApp();
}

type PaymentMethod = "card" | "paypal";

interface OrderItemInput {
	id: string;
	name: string;
	quantity: number;
	unitPrice: number;
}

interface CreateOrderInput {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	pickupDate: string;
	pickupLocation: string;
	specialRequests?: string;
	paymentMethod: PaymentMethod;
	items: OrderItemInput[];
}

const validateEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

const sanitizeName = (value: string): string => value.trim().replace(/\s+/g, " ");

const validatePhone = (phone: string): boolean => {
	const phoneRegex = /^\+?[\d\s-]+$/;
	return phoneRegex.test(phone) && phone.replace(/[\s-]/g, "").length >= 6;
};

const roundCurrency = (amount: number): number =>
	Math.round((amount + Number.EPSILON) * 100) / 100;

const assertValidCreateOrderPayload = (payload: unknown): CreateOrderInput => {
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
		throw new HttpsError("invalid-argument", "First and last name are required.");
	}

	if (!validateEmail(email)) {
		throw new HttpsError("invalid-argument", "Invalid email format.");
	}

	if (!validatePhone(phone)) {
		throw new HttpsError("invalid-argument", "Invalid phone format.");
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
		throw new HttpsError("invalid-argument", "Pickup date must be YYYY-MM-DD.");
	}

	if (!pickupLocation) {
		throw new HttpsError("invalid-argument", "Pickup location is required.");
	}

	if (paymentMethod !== "card" && paymentMethod !== "paypal") {
		throw new HttpsError("invalid-argument", "Invalid payment method.");
	}

	if (!Array.isArray(items) || items.length === 0) {
		throw new HttpsError("invalid-argument", "At least one item is required.");
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

		if (!id || !name) {
			throw new HttpsError("invalid-argument", "Order item id and name are required.");
		}

		if (!Number.isInteger(quantity) || quantity <= 0) {
			throw new HttpsError("invalid-argument", "Order item quantity must be a positive integer.");
		}

		if (!Number.isFinite(unitPrice) || unitPrice < 0) {
			throw new HttpsError("invalid-argument", "Order item unit price must be non-negative.");
		}

		return {
			id,
			name,
			quantity,
			unitPrice: roundCurrency(unitPrice),
		};
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

export const createOrder = onCall(async (request) => {
	const payload = assertValidCreateOrderPayload(request.data);
	const db = getFirestore();

	const subtotal = roundCurrency(
		payload.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
	);

	const counterRef = db.collection("meta").doc("orderCounter");
	const sequence = await db.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(counterRef);
		const currentValue = snapshot.exists ? Number(snapshot.data()?.current ?? 0) : 0;
		const nextValue = currentValue + 1;
		transaction.set(counterRef, {current: nextValue}, {merge: true});
		return nextValue;
	});

	const year = new Date().getFullYear();
	const orderNumber = `NZ-${year}-${String(sequence).padStart(6, "0")}`;
	const orderRef = db.collection("orders").doc();

	await orderRef.set({
		orderNumber,
		status: "pending",
		customerUid: request.auth?.uid ?? null,
		customer: {
			firstName: payload.firstName,
			lastName: payload.lastName,
			email: payload.email,
			phone: payload.phone,
		},
		pickup: {
			date: payload.pickupDate,
			location: payload.pickupLocation,
		},
		specialRequests: payload.specialRequests,
		payment: {
			method: payload.paymentMethod,
			status: "pending",
		},
		totals: {
			subtotal,
			currency: "EUR",
		},
		items: payload.items,
		createdAt: FieldValue.serverTimestamp(),
		updatedAt: FieldValue.serverTimestamp(),
	});

	return {
		orderId: orderRef.id,
		orderNumber,
		status: "pending",
	};
});

export const setStaffClaim = onCall(async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "Sign in is required.");
	}

	const isAdmin = request.auth.token.admin === true;
	if (!isAdmin) {
		throw new HttpsError("permission-denied", "Only admins can manage staff claims.");
	}

	const payload = request.data as {uid?: string; staff?: boolean} | undefined;
	const uid = (payload?.uid ?? "").trim();
	const staff = payload?.staff ?? true;

	if (!uid) {
		throw new HttpsError("invalid-argument", "uid is required.");
	}

	const auth = getAuth();
	const user = await auth.getUser(uid);
	const existingClaims = user.customClaims ?? {};
	const nextClaims: Record<string, unknown> = {...existingClaims};

	if (staff) {
		nextClaims.staff = true;
	} else {
		delete nextClaims.staff;
	}

	await auth.setCustomUserClaims(uid, nextClaims);

	return {
		uid,
		staff,
	};
});
