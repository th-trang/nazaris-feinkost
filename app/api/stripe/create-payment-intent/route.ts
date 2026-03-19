import {NextRequest, NextResponse} from "next/server";
import Stripe from "stripe";

interface CreatePaymentIntentRequest {
  amount: number; // total in EUR (e.g. 12.50)
}

interface UpdateMetadataRequest {
  paymentIntentId: string;
  orderNumber: string;
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!stripe) {
    return NextResponse.json(
      {error: "Stripe is not configured. Set STRIPE_SECRET_KEY."},
      {status: 500},
    );
  }

  let body: CreatePaymentIntentRequest;

  try {
    body = (await request.json()) as CreatePaymentIntentRequest;
  } catch {
    return NextResponse.json({error: "Invalid request body."}, {status: 400});
  }

  if (!body.amount || body.amount <= 0) {
    return NextResponse.json(
      {error: "A positive amount is required."},
      {status: 400},
    );
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(body.amount * 100),
      currency: "eur",
      payment_method_types: ["card", "paypal", "sepa_debit"],
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("PaymentIntent creation error:", error);
    return NextResponse.json(
      {error: "Could not create payment intent."},
      {status: 500},
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  if (!stripe) {
    return NextResponse.json(
      {error: "Stripe is not configured. Set STRIPE_SECRET_KEY."},
      {status: 500},
    );
  }

  let body: UpdateMetadataRequest;

  try {
    body = (await request.json()) as UpdateMetadataRequest;
  } catch {
    return NextResponse.json({error: "Invalid request body."}, {status: 400});
  }

  if (!body.paymentIntentId || !body.orderNumber) {
    return NextResponse.json(
      {error: "paymentIntentId and orderNumber are required."},
      {status: 400},
    );
  }

  try {
    await stripe.paymentIntents.update(body.paymentIntentId, {
      metadata: {orderNumber: body.orderNumber},
    });
    return NextResponse.json({success: true});
  } catch (error) {
    console.error("PaymentIntent metadata update error:", error);
    return NextResponse.json(
      {error: "Could not update payment intent."},
      {status: 500},
    );
  }
}
