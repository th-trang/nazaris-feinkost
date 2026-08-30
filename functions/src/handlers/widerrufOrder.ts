import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import Stripe from "stripe";
import {sendTelegramNotification} from "../lib/telegram.js";
import {sendOrderCancellationEmail, emailSecrets} from "../lib/email.js";
import {findOrderCandidates} from "../lib/orders.js";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");
const telegramChatId = defineSecret("TELEGRAM_CHAT_ID");

const FUNCTION_OPTIONS = {
  region: "europe-west3",
  invoker: "public" as const,
  secrets: [stripeSecretKey, telegramBotToken, telegramChatId, ...emailSecrets],
};

const CANCELLABLE_STATUSES = ["pending", "paid"];

function normalise(s: string) {
  return (s ?? "").trim().toLowerCase();
}

interface WiderrufPayload {
  action: "lookup" | "cancel";
  orderNumber: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const widerrufOrder = onCall(FUNCTION_OPTIONS, async (request) => {
  const data = request.data as WiderrufPayload;
  const {action, orderNumber, email, firstName, lastName} = data;

  if (!action || !orderNumber || !email || !firstName || !lastName) {
    throw new HttpsError("invalid-argument", "missing_fields");
  }

  const db = getFirestore();

  // ── Find order by orderNumber + customer verification ─────────────────────
  const candidates = await findOrderCandidates(
    db,
    orderNumber.trim().toUpperCase(),
  );

  if (candidates.length === 0) {
    throw new HttpsError("not-found", "not_found");
  }

  let matchedDoc: FirebaseFirestore.DocumentSnapshot | null = null;

  for (const doc of candidates) {
    const d = doc.data() ?? {};
    const customer = (d.customer ?? {}) as Record<string, string>;

    if (
      normalise(customer.email) === normalise(email) &&
      normalise(customer.firstName) === normalise(firstName) &&
      normalise(customer.lastName) === normalise(lastName)
    ) {
      matchedDoc = doc;
      break;
    }
  }

  if (!matchedDoc) {
    throw new HttpsError("not-found", "not_found");
  }

  const docData = matchedDoc.data() ?? {};
  const status = String(docData.status ?? "");
  const isComplete = Boolean(docData.isComplete);
  const pickup = (docData.pickup ?? {}) as Record<string, string>;
  const totals = (docData.totals ?? {}) as Record<string, unknown>;

  // ── Lookup ─────────────────────────────────────────────────────────────────
  if (action === "lookup") {
    return {
      orderId: matchedDoc.id,
      orderNumber: docData.orderNumber,
      status,
      isComplete,
      pickupDate: pickup.date ?? "",
      pickupLocation: pickup.location ?? "",
      // Older orders only stored the pre-discount subtotal.
      total: Number(totals.total ?? totals.subtotal ?? 0),
      currency: String(totals.currency ?? "EUR"),
    };
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────
  if (status === "canceled") {
    throw new HttpsError("already-exists", "already_canceled");
  }

  if (isComplete) {
    throw new HttpsError("failed-precondition", "already_completed");
  }

  if (!CANCELLABLE_STATUSES.includes(status)) {
    throw new HttpsError("failed-precondition", "not_cancellable");
  }

  const payment = (docData.payment ?? {}) as Record<string, string>;
  let paymentIntentId: string | null = payment.stripePaymentId ?? null;

  console.log(`[widerrufOrder] Canceling order ${docData.orderNumber} — Firestore status: ${status}, paymentIntentId: ${paymentIntentId ?? "none"}`);

  // Issue Stripe refund when the order has already been paid.
  // We verify payment state directly with Stripe so this works even when the
  // webhook hasn't fired yet (e.g. local emulator).
  let refundId: string | null = null;
  const stripe = new Stripe(stripeSecretKey.value());

  // No stored ID means either the webhook has not written one yet, or the
  // order predates the rename from stripePaymentIntentId and never carried
  // it under this name. Both are covered by searching on the metadata the
  // webhook matches orders by anyway.
  if (!paymentIntentId) {
    console.log(`[widerrufOrder] payment.stripePaymentId missing — searching Stripe for ${docData.orderNumber}`);
    const searchResult = await stripe.paymentIntents.search({
      query: `metadata['orderNumber']:'${docData.orderNumber}' AND status:'succeeded'`,
      limit: 1,
    });
    paymentIntentId = searchResult.data[0]?.id ?? null;
    console.log(`[widerrufOrder] Stripe search result: ${paymentIntentId ?? "not found"}`);
  }

  if (paymentIntentId) {
    // Retrieve the live status from Stripe — don't trust only Firestore
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log(`[widerrufOrder] Stripe PI ${paymentIntentId} status: ${pi.status}`);

    if (pi.status === "succeeded") {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          reason: "requested_by_customer",
        });
        refundId = refund.id;
        console.log(`[widerrufOrder] Refund created: ${refundId} for order ${docData.orderNumber}`);
      } catch (err) {
        console.error(`[widerrufOrder] Stripe refund failed for order ${docData.orderNumber}:`, err);
        throw new HttpsError("internal", "refund_failed");
      }
    } else {
      console.log(`[widerrufOrder] PI not succeeded (${pi.status}) — canceling without refund`);
    }
  } else {
    console.log(`[widerrufOrder] No payment intent found — canceling without refund`);
  }

  const updatePayload: Record<string, unknown> = {
    status: "canceled",
    canceledAt: FieldValue.serverTimestamp(),
    cancelReason: "customer_widerruf",
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (refundId) {
    updatePayload["payment.refundId"] = refundId;
    updatePayload["payment.refundStatus"] = "refunded";
  }

  await db.collection("orders").doc(matchedDoc.id).update(updatePayload);

  // ── Telegram notification ──────────────────────────────────────────────────
  const customer = (docData.customer ?? {}) as Record<string, string>;
  const notificationLines = [
    `❌ Bestellung storniert: ${docData.orderNumber}`,
    `Name: ${customer.firstName} ${customer.lastName}`,
    `E-Mail: ${customer.email}`,
    `Abholdatum: ${pickup.date ?? ""}`,
    `Abholort: ${pickup.location ?? ""}`,
    refundId ? `Rückerstattung: ${refundId}` : "Keine Rückerstattung (Zahlung ausstehend)",
  ];

  await sendTelegramNotification(
    notificationLines.join("\n"),
    telegramBotToken.value(),
    telegramChatId.value(),
  );

  // ── Cancellation email to customer ──────────────────────────────────
  await sendOrderCancellationEmail({
    orderNumber: docData.orderNumber,
    firstName: customer.firstName ?? "",
    lastName: customer.lastName ?? "",
    email: customer.email ?? "",
    pickupDate: pickup.date ?? "",
    pickupLocation: pickup.location ?? "",
    refunded: refundId !== null,
    refundId,
  });

  return {success: true, orderNumber: docData.orderNumber, refunded: refundId !== null};
});
