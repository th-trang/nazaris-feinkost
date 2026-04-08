import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {getFirestore} from "firebase-admin/firestore";
import Stripe from "stripe";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

const PAYMENT_STATUS_MAP: Record<string, string> = {
	"payment_intent.succeeded": "paid",
	"payment_intent.payment_failed": "failed",
	"payment_intent.canceled": "canceled",
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
	card: "card",
	paypal: "paypal",
	sepa_debit: "sepa_debit",
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
			const snapshot = await db
				.collection("orders")
				.where("orderNumber", "==", orderNumber)
				.limit(1)
				.get();

			if (snapshot.empty) {
				console.warn(`Webhook: no order found for orderNumber=${orderNumber}`);
				await eventRef.update({status: "done", note: "order_not_found", updatedAt: new Date()});
				res.status(200).json({received: true});
				return;
			}

			const orderDoc = snapshot.docs[0];
			const updateData: Record<string, unknown> = {
				"payment.status": paymentStatus,
				"payment.stripePaymentIntentId": paymentIntent.id,
				updatedAt: new Date(),
			};

			// Persist the resolved payment method
			const methodType = paymentIntent.payment_method_types?.[0];
			if (methodType) {
				updateData["payment.method"] = PAYMENT_METHOD_MAP[methodType] ?? methodType;
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
