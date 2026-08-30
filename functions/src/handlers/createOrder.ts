import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {createHash} from "node:crypto";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import type Stripe from "stripe";
import {locationCatalog} from "../locationCatalog.js";
import {toMinorUnits} from "../lib/money.js";
import {
	assertMinimumOrder,
	loadPricedCart,
	toStoredItem,
	type OrderTotals,
} from "../lib/pricing.js";
import {getStripe, stripeSecretKey} from "../lib/stripeClient.js";
import {assertValidCreateOrderPayload} from "../lib/validation.js";

const FUNCTION_OPTIONS = {
	region: "europe-west3",
	invoker: "public" as const,
	secrets: [stripeSecretKey],
};

const toGuestUserId = (email: string): string => {
	const hash = createHash("sha256").update(email).digest("hex").slice(0, 24);
	return `guest_${hash}`;
};

const locationIdByName = new Map(
	locationCatalog.map((location) => [location.name.toLowerCase(), location.id]),
);

const getPickupLocationId = (pickupLocation: string): string =>
	locationIdByName.get(pickupLocation.trim().toLowerCase()) ?? "custom";

/**
 * Ties the order to the PaymentIntent the customer is about to confirm.
 *
 * The PaymentIntent amount was set by createPaymentIntent from the same
 * catalog prices, so if it does not match the total we just computed, the cart
 * was tampered with (or has since changed) and the order is refused rather
 * than accepted at the cheaper amount.
 */
const assertPaymentIntentMatchesTotals = (
	paymentIntent: Stripe.PaymentIntent,
	totals: OrderTotals,
): void => {
	if (paymentIntent.metadata?.orderNumber) {
		throw new HttpsError(
			"failed-precondition",
			"This payment session already belongs to an order.",
		);
	}

	if (paymentIntent.status === "succeeded" || paymentIntent.status === "canceled") {
		throw new HttpsError(
			"failed-precondition",
			"This payment session can no longer be used.",
		);
	}

	if (paymentIntent.currency !== totals.currency.toLowerCase()) {
		throw new HttpsError("failed-precondition", "Payment currency mismatch.");
	}

	if (paymentIntent.amount !== toMinorUnits(totals.total)) {
		console.warn(
			`createOrder: amount mismatch for ${paymentIntent.id} — ` +
			`intent ${paymentIntent.amount}, cart ${toMinorUnits(totals.total)}`,
		);
		throw new HttpsError(
			"failed-precondition",
			"The cart changed since payment was started. Please try again.",
		);
	}
};

export const createOrder = onCall(FUNCTION_OPTIONS, async (request) => {
	const payload = assertValidCreateOrderPayload(request.data);

	if (!payload.paymentIntentId) {
		throw new HttpsError("invalid-argument", "A paymentIntentId is required.");
	}

	const db = getFirestore();
	const customerUid = request.auth?.uid ?? null;
	const customerUserId = customerUid ?? toGuestUserId(payload.email);
	const pickupLocationId = getPickupLocationId(payload.pickupLocation);

	// Authoritative prices — the client only told us which products and how much.
	const {items, totals} = await loadPricedCart(db, payload.items);
	assertMinimumOrder(totals);

	const stripe = getStripe();
	let paymentIntent: Stripe.PaymentIntent;
	try {
		paymentIntent = await stripe.paymentIntents.retrieve(payload.paymentIntentId);
	} catch {
		throw new HttpsError("not-found", "Unknown payment session.");
	}

	assertPaymentIntentMatchesTotals(paymentIntent, totals);

	const counterRef = db.collection("meta").doc("orderCounter");
	const sequence = await db.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(counterRef);
		const currentValue = snapshot.exists
			? Number(snapshot.data()?.current ?? 0)
			: 0;
		const nextValue = currentValue + 1;
		transaction.set(counterRef, {current: nextValue}, {merge: true});
		return nextValue;
	});

	const year = new Date().getFullYear();
	const orderNumber = `NZ-${year}-${String(sequence).padStart(6, "0")}`;
	// The order number is the document ID: the Firestore console lists something
	// readable, and the webhook can read an order without a query.
	const orderRef = db.collection("orders").doc(orderNumber);
	const userRef = db.collection("users").doc(customerUserId);

	await db.runTransaction(async (transaction) => {
		const userSnapshot = await transaction.get(userRef);
		const now = FieldValue.serverTimestamp();

		if (!userSnapshot.exists) {
			transaction.set(userRef, {
				uid: customerUid,
				type: "customer",
				email: payload.email,
				firstName: payload.firstName,
				lastName: payload.lastName,
				phone: payload.phone,
				createdAt: now,
				updatedAt: now,
				lastOrderAt: now,
			});
		} else {
			transaction.set(
				userRef,
				{
					uid: customerUid,
					type: "customer",
					email: payload.email,
					firstName: payload.firstName,
					lastName: payload.lastName,
					phone: payload.phone,
					updatedAt: now,
					lastOrderAt: now,
				},
				{merge: true},
			);
		}
	});

	await orderRef.create({
		orderNumber,
		status: "pending",
		isComplete: false,
		customerUid,
		customerUserId,
		customerName: `${payload.firstName} ${payload.lastName}`,
		customerEmail: payload.email,
		customerPhone: payload.phone,
		pickupDate: payload.pickupDate,
		pickupLocation: payload.pickupLocation,
		pickupLocationId,
		customer: {
			firstName: payload.firstName,
			lastName: payload.lastName,
			email: payload.email,
			phone: payload.phone,
		},
		pickup: {
			date: payload.pickupDate,
			location: payload.pickupLocation,
			locationId: pickupLocationId,
		},
		specialRequests: payload.specialRequests,
		payment: {
			method: payload.paymentMethod,
			status: "pending",
			stripePaymentId: paymentIntent.id,
		},
		totals,
		items: items.map(toStoredItem),
		createdAt: FieldValue.serverTimestamp(),
		updatedAt: FieldValue.serverTimestamp(),
	}).catch((error) => {
		// create() rather than set(): with the number as the ID, a counter that
		// ever hands out a duplicate fails loudly here instead of silently
		// overwriting a live order.
		console.error(`createOrder: could not create order ${orderNumber}:`, error);
		throw new HttpsError(
			"aborted",
			"Could not reserve an order number. Please try again.",
		);
	});

	// The webhook matches payments to orders through this metadata field.
	try {
		await stripe.paymentIntents.update(paymentIntent.id, {
			metadata: {...paymentIntent.metadata, orderNumber},
		});
	} catch (error) {
		console.error(
			`createOrder: could not attach ${orderNumber} to ${paymentIntent.id}:`,
			error,
		);
		throw new HttpsError(
			"internal",
			"Could not link the order to the payment. Please try again.",
		);
	}

	return {
		orderId: orderRef.id,
		orderNumber,
		status: "pending",
		totals,
	};
});
