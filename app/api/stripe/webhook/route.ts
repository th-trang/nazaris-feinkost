import {NextRequest, NextResponse} from "next/server";
import Stripe from "stripe";
import {getApps, initializeApp, cert, type App} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({projectId, clientEmail, privateKey}),
    });
  }

  // Falls back to Application Default Credentials (e.g. on GCP)
  return initializeApp({projectId});
}

const PAYMENT_STATUS_MAP: Record<string, string> = {
  "payment_intent.succeeded": "paid",
  "payment_intent.payment_failed": "failed",
  "payment_intent.canceled": "expired",
  "payment_intent.processing": "processing",
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  card: "card",
  paypal: "paypal",
  sepa_debit: "sepa_debit",
};

async function updateOrderPayment(
  orderNumber: string,
  paymentStatus: string,
  paymentIntentId: string,
  paymentMethodType?: string,
) {
  const db = getFirestore(getAdminApp());
  const snapshot = await db
    .collection("orders")
    .where("orderNumber", "==", orderNumber)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.warn(`Webhook: no order found for orderNumber=${orderNumber}`);
    return;
  }

  const orderDoc = snapshot.docs[0];
  const updateData: Record<string, unknown> = {
    "payment.status": paymentStatus,
    "payment.stripePaymentIntentId": paymentIntentId,
    updatedAt: new Date(),
  };

  if (paymentMethodType) {
    const mapped = PAYMENT_METHOD_MAP[paymentMethodType] ?? paymentMethodType;
    updateData["payment.method"] = mapped;
  }

  await orderDoc.ref.update(updateData);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!stripe) {
    return NextResponse.json(
      {error: "Stripe is not configured."},
      {status: 500},
    );
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("Webhook: STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json(
      {error: "Webhook secret is not configured."},
      {status: 500},
    );
  }

  const body = await request.text();

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      {error: "Missing stripe-signature header."},
      {status: 400},
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      {error: "Webhook signature verification failed."},
      {status: 400},
    );
  }

  // --- Idempotency check ---
  const db = getFirestore(getAdminApp());
  const eventRef = db.collection("processed_events").doc(event.id);
  const eventSnap = await eventRef.get();

  if (eventSnap.exists) {
    return NextResponse.json({received: true});
  }

  const paymentStatus = PAYMENT_STATUS_MAP[event.type];
  if (!paymentStatus) {
    // Event type we don't handle — acknowledge it
    return NextResponse.json({received: true});
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderNumber = paymentIntent.metadata?.orderNumber;

  if (!orderNumber) {
    console.warn(`Webhook ${event.type}: no orderNumber in metadata`);
    return NextResponse.json({received: true});
  }

  // Mark as processing BEFORE updating the order to guard against race conditions
  await eventRef.set({
    status: "processing",
    eventType: event.type,
    createdAt: new Date(),
  });

  const paymentMethodType =
    paymentIntent.payment_method_types?.[0] ?? undefined;

  try {
    await updateOrderPayment(
      orderNumber,
      paymentStatus,
      paymentIntent.id,
      paymentMethodType,
    );

    await eventRef.update({status: "done", updatedAt: new Date()});
  } catch (error) {
    console.error("Webhook: failed to update order", error);
    await eventRef.delete();
    return NextResponse.json(
      {error: "Failed to update order."},
      {status: 500},
    );
  }

  return NextResponse.json({received: true});
}
