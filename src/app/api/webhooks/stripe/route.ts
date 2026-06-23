import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import fs from 'fs/promises';
import path from 'path';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const ORDERS_PATH = path.join(process.cwd(), 'src', 'data', 'orders.json');

interface Order {
  sessionId: string;
  amountTotal: number;
  currency: string;
  customerEmail: string | null;
  completedAt: string;
}

async function appendOrder(order: Order): Promise<void> {
  let orders: Order[] = [];
  try {
    const raw = await fs.readFile(ORDERS_PATH, 'utf-8');
    orders = JSON.parse(raw) as Order[];
  } catch { /* first order or file missing */ }

  // Idempotency: Stripe retries webhooks — skip if this session is already recorded
  if (orders.some((o) => o.sessionId === order.sessionId)) return;

  orders.push(order);
  await fs.writeFile(ORDERS_PATH, JSON.stringify(orders, null, 2));
}

export async function POST(req: NextRequest) {
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const order: Order = {
      sessionId: session.id,
      amountTotal: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      customerEmail: session.customer_details?.email ?? null,
      completedAt: new Date().toISOString(),
    };
    await appendOrder(order).catch((err) => {
      console.error('Failed to persist order:', err);
    });
    console.log(`Order completed: ${session.id} — $${((order.amountTotal) / 100).toFixed(2)}`);
  }

  return NextResponse.json({ received: true });
}
