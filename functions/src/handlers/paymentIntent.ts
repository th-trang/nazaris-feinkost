/**
 * PaymentIntent lifecycle.
 *
 * The browser never supplies an amount. It sends product IDs plus how much of
 * each was ordered; the amount is derived from the Firestore catalog by the
 * pricing engine. Updating or cancelling an existing PaymentIntent requires the
 * caller to echo back its client secret, which only the session that created it
 * ever receives — otherwise anyone holding an ID could cancel a stranger's
 * payment.
 */
import {getFirestore} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {timingSafeEqual} from "node:crypto";
import type Stripe from "stripe";
import {toMinorUnits} from "../lib/money.js";
import {findOrderByNumber} from "../lib/orders.js";
import {isValidPickupDate, paymentMethodTypesForPickupDate} from "../lib/pickup.js";
import {
	assertMinimumOrder,
	assertValidCartLines,
	loadPricedCart,
} from "../lib/pricing.js";
import {getStripe, stripeSecretKey} from "../lib/stripeClient.js";

const PAYMENT_SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const FUNCTION_OPTIONS = {
	region: "europe-west3",
	invoker: "public" as const,
	secrets: [stripeSecretKey],
};

const assertPickupDate = (value: unknown): string => {
	const pickupDate = typeof value === "string" ? value.trim() : "";
	if (!isValidPickupDate(pickupDate)) {
		throw new HttpsError("invalid-argument", "Pickup date must be YYYY-MM-DD.");
	}
	return pickupDate;
};

const assertPaymentIntentId = (value: unknown): string => {
	const id = typeof value === "string" ? value.trim() : "";
	if (!id.startsWith("pi_")) {
		throw new HttpsError("invalid-argument", "A paymentIntentId is required.");
	}
	return id;
};

const secretsMatch = (a: string, b: string): boolean => {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	return left.length === right.length && timingSafeEqual(left, right);
};

/**
 * Retrieves a PaymentIntent only if the caller can prove it owns the checkout
 * session by echoing back the client secret Stripe handed it.
 */
const retrieveOwnedPaymentIntent = async (
	stripe: Stripe,
	data: unknown,
): Promise<Stripe.PaymentIntent> => {
	const payload = (data ?? {}) as Record<string, unknown>;
	const paymentIntentId = assertPaymentIntentId(payload.paymentIntentId);
	const clientSecret =
		typeof payload.clientSecret === "string" ? payload.clientSecret : "";

	if (!clientSecret) {
		throw new HttpsError("invalid-argument", "A clientSecret is required.");
	}

	let paymentIntent: Stripe.PaymentIntent;
	try {
		paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
	} catch {
		throw new HttpsError("not-found", "Unknown payment session.");
	}

	if (
		!paymentIntent.client_secret ||
		!secretsMatch(paymentIntent.client_secret, clientSecret)
	) {
		throw new HttpsError("permission-denied", "Unknown payment session.");
	}

	return paymentIntent;
};


export const createPaymentIntent = onCall(FUNCTION_OPTIONS, async (request) => {
	const payload = (request.data ?? {}) as Record<string, unknown>;
	const lines = assertValidCartLines(payload.items);
	const pickupDate = assertPickupDate(payload.pickupDate);

	const {totals} = await loadPricedCart(getFirestore(), lines);
	assertMinimumOrder(totals);

	const expiresAt = new Date(
		Date.now() + PAYMENT_SESSION_DURATION_MS,
	).toISOString();

	const paymentIntent = await getStripe().paymentIntents.create({
		amount: toMinorUnits(totals.total),
		currency: totals.currency.toLowerCase(),
		payment_method_types: paymentMethodTypesForPickupDate(pickupDate),
		metadata: {expiresAt},
	});

	return {
		clientSecret: paymentIntent.client_secret,
		paymentIntentId: paymentIntent.id,
		expiresAt,
		totals,
	};
});

/**
 * Re-prices the cart and syncs the PaymentIntent. Called when the pickup date
 * changes (which decides whether SEPA is offered) or the cart is edited.
 */
export const updatePaymentIntent = onCall(FUNCTION_OPTIONS, async (request) => {
	const payload = (request.data ?? {}) as Record<string, unknown>;
	const lines = assertValidCartLines(payload.items);
	const pickupDate = assertPickupDate(payload.pickupDate);

	const stripe = getStripe();
	const paymentIntent = await retrieveOwnedPaymentIntent(stripe, request.data);

	const {totals} = await loadPricedCart(getFirestore(), lines);
	assertMinimumOrder(totals);

	const paymentMethodTypes = paymentMethodTypesForPickupDate(pickupDate);
	const amount = toMinorUnits(totals.total);

	// Once an order is attached the amount is settled: the pickup date may still
	// change (it decides whether SEPA is offered), but the total may not.
	if (paymentIntent.metadata?.orderNumber && paymentIntent.amount !== amount) {
		throw new HttpsError(
			"failed-precondition",
			"This payment session already belongs to an order.",
		);
	}

	await stripe.paymentIntents.update(paymentIntent.id, {
		amount,
		payment_method_types: paymentMethodTypes,
	});

	return {
		success: true,
		sepaAllowed: paymentMethodTypes.includes("sepa_debit"),
		totals,
	};
});

export const cancelPaymentIntent = onCall(FUNCTION_OPTIONS, async (request) => {
	const stripe = getStripe();
	const paymentIntent = await retrieveOwnedPaymentIntent(stripe, request.data);

	if (paymentIntent.status === "succeeded" || paymentIntent.status === "canceled") {
		return {success: true, status: paymentIntent.status};
	}

	const canceled = await stripe.paymentIntents.cancel(paymentIntent.id);
	return {success: true, status: canceled.status};
});

/**
 * Re-attaches an existing order to a fresh payment session.
 *
 * A declined payment leaves the checkout page with a new PaymentIntent while
 * the order already exists. Without this the new intent would carry no
 * orderNumber and the webhook could never match the payment to the order.
 *
 * Safe to expose: the caller must own the session (client secret), the order
 * must still be awaiting payment, and the session amount must equal the total
 * already stored on that order.
 */
export const bindOrderToPaymentIntent = onCall(FUNCTION_OPTIONS, async (request) => {
	const payload = (request.data ?? {}) as Record<string, unknown>;
	const orderNumber =
		typeof payload.orderNumber === "string" ? payload.orderNumber.trim() : "";

	if (!orderNumber) {
		throw new HttpsError("invalid-argument", "An orderNumber is required.");
	}

	const stripe = getStripe();
	const paymentIntent = await retrieveOwnedPaymentIntent(stripe, request.data);

	const boundOrderNumber = paymentIntent.metadata?.orderNumber;
	if (boundOrderNumber && boundOrderNumber !== orderNumber) {
		throw new HttpsError(
			"failed-precondition",
			"This payment session already belongs to another order.",
		);
	}

	const db = getFirestore();
	const orderDoc = await findOrderByNumber(db, orderNumber);

	if (!orderDoc) {
		throw new HttpsError("not-found", "Unknown order.");
	}

	const order = orderDoc.data() ?? {};
	const paymentState = (order.payment ?? {}) as Record<string, unknown>;

	if (paymentState.status !== "pending") {
		throw new HttpsError(
			"failed-precondition",
			"This order is no longer awaiting payment.",
		);
	}

	const orderTotals = (order.totals ?? {}) as Record<string, unknown>;
	const expected = Number(orderTotals.total);

	if (!Number.isFinite(expected) || paymentIntent.amount !== toMinorUnits(expected)) {
		throw new HttpsError(
			"failed-precondition",
			"The payment amount does not match this order.",
		);
	}

	if (!boundOrderNumber) {
		await stripe.paymentIntents.update(paymentIntent.id, {
			metadata: {...paymentIntent.metadata, orderNumber},
		});
	}

	await orderDoc.ref.update({
		"payment.stripePaymentId": paymentIntent.id,
		updatedAt: new Date(),
	});

	return {success: true, orderNumber};
});
