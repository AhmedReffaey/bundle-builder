import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import type { ReviewItem } from '@/types';

// Set STRIPE_SECRET_KEY in .env.local to enable real payments.
// Without it the endpoint returns a mock session for development.
const stripeKey = process.env.STRIPE_SECRET_KEY;

interface CheckoutBody {
  items: ReviewItem[];
  total: number;
}

export async function POST(req: NextRequest) {
  const { items, total }: CheckoutBody = await req.json();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3002';

  if (!stripeKey) {
    // Dev / demo mode — return a fake session so the UI can still show success
    return NextResponse.json({
      mode: 'mock',
      url: `${baseUrl}/checkout/success?session_id=mock_${Date.now()}`,
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' });

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: 'usd',
      unit_amount: Math.round(item.price * 100),
      product_data: {
        name: item.variantLabel ? `${item.name} · ${item.variantLabel}` : item.name,
        images: [item.image],
      },
      ...(item.isMonthly ? { recurring: { interval: 'month' } } : {}),
    },
    quantity: item.quantity,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: items.some((i) => i.isMonthly) ? 'subscription' : 'payment',
      line_items: lineItems,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/checkout/cancel`,
      metadata: { bundle_total: total.toFixed(2) },
    });
    return NextResponse.json({ mode: 'stripe', url: session.url });
  } catch (err) {
    console.error('Stripe session creation failed:', err);
    return NextResponse.json({ error: 'Checkout failed. Please try again.' }, { status: 500 });
  }
}
