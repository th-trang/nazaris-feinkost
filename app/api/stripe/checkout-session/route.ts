import {NextRequest, NextResponse} from "next/server";
import Stripe from "stripe";

interface StripeCheckoutItem {
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

interface StripeCheckoutRequest {
  orderNumber: string;
  email: string;
  locale?: string;
  items: StripeCheckoutItem[];
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY)
  : null;

const isAbsoluteImageUrl = (value: string): boolean =>
  value.startsWith("https://") || value.startsWith("http://");

const normalizeLocale = (value?: string): "de" | "en" => {
  if (!value) {
    return "de";
  }

  return value.toLowerCase().startsWith("en") ? "en" : "de";
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!stripe) {
    return NextResponse.json(
      {error: "Stripe is not configured. Set STRIPE_SECRET_KEY."},
      {status: 500},
    );
  }

  let body: StripeCheckoutRequest;

  try {
    body = (await request.json()) as StripeCheckoutRequest;
  } catch {
    return NextResponse.json({error: "Invalid request body."}, {status: 400});
  }

  if (!body.orderNumber || !body.email || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      {error: "Missing required payment data."},
      {status: 400},
    );
  }

  const sanitizedItems = body.items.filter(
    (item) => item.name && item.quantity > 0 && item.unitPrice > 0,
  );

  if (sanitizedItems.length === 0) {
    return NextResponse.json(
      {error: "No valid line items provided."},
      {status: 400},
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    request.nextUrl.origin;

  const locale = normalizeLocale(body.locale);
  const successUrl = `${origin}/${locale}/checkout?stripe=success&orderNumber=${encodeURIComponent(body.orderNumber)}`;
  const cancelUrl = `${origin}/${locale}/checkout?stripe=cancelled`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: body.email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale,
      metadata: {
        orderNumber: body.orderNumber,
      },
      line_items: sanitizedItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(item.unitPrice * 100),
          product_data: {
            name: item.name,
            ...(item.imageUrl && isAbsoluteImageUrl(item.imageUrl)
              ? {images: [item.imageUrl]}
              : {}),
          },
        },
      })),
    });

    if (!session.url) {
      return NextResponse.json(
        {error: "Stripe did not return a checkout URL."},
        {status: 500},
      );
    }

    return NextResponse.json({url: session.url});
  } catch (error) {
    console.error("Stripe checkout session error", error);
    return NextResponse.json(
      {error: "Could not create Stripe checkout session."},
      {status: 500},
    );
  }
}