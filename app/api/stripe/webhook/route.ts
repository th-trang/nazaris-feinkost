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
  "payment_intent.canceled": "cancelled",
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
    paymentStatus,
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

  const body = await request.text();

  let event: Stripe.Event;

  if (STRIPE_WEBHOOK_SECRET) {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        {error: "Missing stripe-signature header."},
        {status: 400},
      );
    }

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
  } else {
    // In development without webhook secret, parse event directly
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      return NextResponse.json(
        {error: "Invalid request body."},
        {status: 400},
      );
    }
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

  const paymentMethodType =
    paymentIntent.payment_method_types?.[0] ?? undefined;

  try {
    await updateOrderPayment(
      orderNumber,
      paymentStatus,
      paymentIntent.id,
      paymentMethodType,
    );
  } catch (error) {
    console.error("Webhook: failed to update order", error);
    return NextResponse.json(
      {error: "Failed to update order."},
      {status: 500},
    );
  }

  return NextResponse.json({received: true});
}
