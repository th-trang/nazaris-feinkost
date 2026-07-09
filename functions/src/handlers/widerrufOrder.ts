import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import Stripe from "stripe";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

const FUNCTION_OPTIONS = {
  region: "europe-west3",
  invoker: "public" as const,
  secrets: [stripeSecretKey],
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
  const snap = await db
    .collection("orders")
    .where("orderNumber", "==", orderNumber.trim().toUpperCase())
    .limit(5)
    .get();

  if (snap.empty) {
    throw new HttpsError("not-found", "not_found");
  }

  let matchedDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  for (const doc of snap.docs) {
    const d = doc.data();
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

  const docData = matchedDoc.data();
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
      total: Number(totals.subtotal ?? 0),
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
  const paymentIntentId = payment.stripePaymentIntentId ?? null;

  // Issue Stripe refund when the order has already been paid
  let refundId: string | null = null;
  if (status === "paid" && paymentIntentId) {
    const stripe = new Stripe(stripeSecretKey.value());
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: "requested_by_customer",
      });
      refundId = refund.id;
      console.log(`[widerrufOrder] Stripe refund created: ${refundId} for order ${docData.orderNumber}`);
    } catch (err) {
      console.error(`[widerrufOrder] Stripe refund failed for order ${docData.orderNumber}:`, err);
      throw new HttpsError("internal", "refund_failed");
    }
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

  return {success: true, orderNumber: docData.orderNumber, refunded: refundId !== null};
});
