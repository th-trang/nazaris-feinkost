import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {getFirestore} from "firebase-admin/firestore";
import Stripe from "stripe";
import {toMinorUnits} from "../lib/money.js";
import {PAYMENT_METHOD_MAP} from "../lib/paymentMethods.js";
import {findOrderByNumber} from "../lib/orders.js";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

const PAYMENT_STATUS_MAP: Record<string, string> = {
	"payment_intent.succeeded": "paid",
	"payment_intent.payment_failed": "failed",
	"payment_intent.canceled": "canceled",
};

/**
 * Works out which method the customer actually used.
 *
 * Apple Pay and Google Pay are not payment method types of their own — they
 * settle as `card`, so payment_method_types reports plain "card" for them. The
 * wallet is only visible on the resulting charge, which is why this reads the
 * charge rather than the intent.
 */
const resolvePaymentMethod = async (
	stripe: Stripe,
	paymentIntent: Stripe.PaymentIntent,
): Promise<string | undefined> => {
	const declaredType = paymentIntent.payment_method_types?.[0];
	const fallback = declaredType
		? PAYMENT_METHOD_MAP[declaredType] ?? declaredType
		: undefined;

	const chargeId =
		typeof paymentIntent.latest_charge === "string"
			? paymentIntent.latest_charge
			: paymentIntent.latest_charge?.id;

	if (!chargeId) {
		return fallback;
	}

	try {
		const charge = await stripe.charges.retrieve(chargeId);
		const details = charge.payment_method_details;

		if (!details?.type) {
			return fallback;
		}

		if (details.type === "card") {
			const wallet = details.card?.wallet?.type;
			return wallet ? PAYMENT_METHOD_MAP[wallet] ?? wallet : "card";
		}

		return PAYMENT_METHOD_MAP[details.type] ?? details.type;
	} catch (error) {
		console.warn(
			`Webhook: could not read charge ${chargeId} for payment method:`,
			error,
		);
		return fallback;
	}
};

export const stripeWebhook = onRequest(
	{
		region: "europe-west3",
		secrets: [stripeSecretKey, stripeWebhookSecret],
	},
	async (req, res) => {
		// Only accept POST
		if (req.method !== "POST") {
			res.status(405).send("Method Not Allowed");
			return;
		}

		const stripe = new Stripe(stripeSecretKey.value());
		const signature = req.headers["stripe-signature"];

		if (!signature) {
			console.warn("Webhook: missing stripe-signature header");
			res.status(400).send("Missing stripe-signature header.");
			return;
		}

		// --- Signature verification (uses raw body, never parsed JSON) ---
		let event: Stripe.Event;

		try {
			event = stripe.webhooks.constructEvent(
				req.rawBody,
				signature,
				stripeWebhookSecret.value(),
			);
		} catch (err) {
			console.error("Webhook signature verification failed:", err);
			res.status(400).send("Webhook signature verification failed.");
			return;
		}

		// --- Idempotency check ---
		const db = getFirestore();
		const eventRef = db.collection("processed_events").doc(event.id);
		const eventSnap = await eventRef.get();

		if (eventSnap.exists) {
			console.log(`Webhook: event ${event.id} already processed — skipping`);
			res.status(200).json({received: true});
			return;
		}

		// --- Event routing ---
		const paymentStatus = PAYMENT_STATUS_MAP[event.type];

		if (!paymentStatus) {
			// Event type we don't handle — acknowledge so Stripe doesn't retry
			res.status(200).json({received: true});
			return;
		}

		const paymentIntent = event.data.object as Stripe.PaymentIntent;
		const orderNumber = paymentIntent.metadata?.orderNumber;

		if (!orderNumber) {
			console.warn(`Webhook ${event.type} (${event.id}): no orderNumber in metadata`);
			res.status(200).json({received: true});
			return;
		}

		// Mark as processing BEFORE updating the order to guard against race conditions
		await eventRef.set({
			status: "processing",
			eventType: event.type,
			orderNumber,
			createdAt: new Date(),
		});

		console.log(`Webhook: processing ${event.type} for order ${orderNumber} (event ${event.id})`);

		// --- Update the order ---
		try {
			const orderDoc = await findOrderByNumber(db, orderNumber);

			if (!orderDoc) {
				console.warn(`Webhook: no order found for orderNumber=${orderNumber}`);
				await eventRef.update({status: "done", note: "order_not_found", updatedAt: new Date()});
				res.status(200).json({received: true});
				return;
			}

			const updateData: Record<string, unknown> = {
				"payment.status": paymentStatus,
				"payment.stripePaymentId": paymentIntent.id,
				updatedAt: new Date(),
			};

			// Last line of defence: never mark an order paid for less than it
			// costs. createOrder already binds the intent to this order at the
			// catalog total, so a shortfall here means something is wrong.
			if (paymentStatus === "paid") {
				// The date the money arrived is what a bookkeeping report files the
				// order under, and it must not move if Stripe replays the event.
				if (!orderDoc.data()?.paidAt) {
					updateData["paidAt"] = new Date();
				}

				const orderTotals = (orderDoc.data()?.totals ?? {}) as Record<string, unknown>;
				const expected = Number(orderTotals.total ?? orderTotals.subtotal);

				if (Number.isFinite(expected) && expected > 0) {
					const expectedMinorUnits = toMinorUnits(expected);
					const received = paymentIntent.amount_received ?? paymentIntent.amount;

					if (received < expectedMinorUnits) {
						console.error(
							`Webhook: order ${orderNumber} underpaid — received ${received}, ` +
							`expected ${expectedMinorUnits}`,
						);
						updateData["payment.status"] = "underpaid";
						updateData["payment.amountReceived"] = received / 100;
						updateData["payment.amountExpected"] = expected;
					}
				}
			}

			// Persist the resolved payment method, wallet included
			const resolvedMethod = await resolvePaymentMethod(stripe, paymentIntent);
			if (resolvedMethod) {
				updateData["payment.method"] = resolvedMethod;
			}

			// On failure, store the error message for debugging / customer support
			if (paymentStatus === "failed") {
				const failureMessage =
					paymentIntent.last_payment_error?.message ?? "Unknown error";
				updateData["payment.failureMessage"] = failureMessage;
			}

			await orderDoc.ref.update(updateData);

			console.log(`Webhook: order ${orderNumber} (${orderDoc.id}) updated to ${paymentStatus}`);
			await eventRef.update({status: "done", updatedAt: new Date()});
		} catch (error) {
			// Log but return 200 — we don't want Stripe to retry on our own infra failures
			console.error(`Webhook: failed to update order ${orderNumber}:`, error);
			await eventRef.update({status: "error", error: String(error), updatedAt: new Date()}).catch(() => {});
		}

		res.status(200).json({received: true});
	},
);
